import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { RazorpayGateway } from '../config/razorpay';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { EnrollmentService } from './enrollment.service';
import { NotificationService } from './notification.service';
import { settingsService } from './settings.service';
import type {
  CreatePaymentOrderResponse,
  VerifyPaymentDto,
  PaymentHistoryItem,
} from '../types';

export class PaymentService {
  private enrollmentService = new EnrollmentService();

  /**
   * Helper: Generate unique order number (e.g. ORD-2026-XXXXX)
   */
  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const randomHex = Math.floor(10000 + Math.random() * 90000).toString();
    return `ORD-${year}-${randomHex}`;
  }

  /**
   * 1. Create Order & Razorpay Order from student's Cart (or direct courseId)
   * Server determines student identity, courses, and prices. Never trust client values.
   */
  public async createCheckoutOrder(
    studentId: string,
    specificCourseId?: string
  ): Promise<CreatePaymentOrderResponse> {
    // 1. Verify Student Profile
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', studentId)
      .maybeSingle();

    if (studentErr || !student) {
      throw ApiError.notFound('Student profile not found');
    }

    // 2. Obtain course IDs
    let courseIds: string[] = [];

    if (specificCourseId) {
      courseIds = [specificCourseId];
    } else {
      // Fetch cart items from database for this student
      const { data: cartRows, error: cartErr } = await supabaseAdmin
        .from('cart_items')
        .select('course_id')
        .eq('student_id', studentId);

      if (cartErr) {
        logger.error('Error querying cart items for student:', cartErr);
        throw ApiError.internal('Failed to retrieve cart items');
      }

      if (!cartRows || cartRows.length === 0) {
        throw ApiError.badRequest('Your shopping cart is empty');
      }

      courseIds = cartRows.map((r) => r.course_id);
    }

    // Remove duplicates if any
    courseIds = Array.from(new Set(courseIds));

    // 3. Query all courses directly from database to get genuine pricing and status
    const { data: courses, error: coursesErr } = await supabaseAdmin
      .from('courses')
      .select('id, title, price, discount_price, price_type, course_status, approval_status')
      .in('id', courseIds);

    if (coursesErr || !courses || courses.length === 0) {
      throw ApiError.notFound('No valid courses found for checkout');
    }

    if (courses.length !== courseIds.length) {
      throw ApiError.badRequest('One or more selected courses do not exist');
    }

    // 4. Validate Course Eligibility: Every course must be Approved & Published
    for (const course of courses) {
      if (course.approval_status !== 'Approved' || course.course_status !== 'Published') {
        throw ApiError.forbidden(
          `Course "${course.title}" is not available for purchase (Status: ${course.course_status}, Approval: ${course.approval_status})`
        );
      }
    }

    // 5. Check if student is already enrolled in any of these courses
    for (const course of courses) {
      const isEnrolled = await this.enrollmentService.checkStudentEnrollment(studentId, course.id);
      if (isEnrolled) {
        throw ApiError.badRequest(`You are already enrolled in "${course.title}"`);
      }
    }

    // 6. Calculate total server-side
    let serverTotalAmount = 0;
    const orderItemsData: { courseId: string; title: string; unitPrice: number }[] = [];

    for (const course of courses) {
      const effectivePrice =
        course.price_type === 'Free'
          ? 0
          : course.discount_price !== null && course.discount_price !== undefined && course.discount_price < course.price
          ? Number(course.discount_price)
          : Number(course.price);

      serverTotalAmount += effectivePrice;
      orderItemsData.push({
        courseId: course.id,
        title: course.title,
        unitPrice: effectivePrice,
      });
    }

    // Free Course Handling
    const isFreeOrder = serverTotalAmount === 0;
    const orderNumber = this.generateOrderNumber();

    // 7. Insert public.orders record (status = Pending)
    const { data: createdOrder, error: orderInsertErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        student_id: studentId,
        total_amount: serverTotalAmount,
        currency: 'INR',
        status: isFreeOrder ? 'Completed' : 'Pending',
      })
      .select('id, order_number, total_amount, currency, status')
      .single();

    if (orderInsertErr || !createdOrder) {
      logger.error('Error inserting order:', orderInsertErr);
      throw ApiError.internal('Failed to initialize checkout order');
    }

    // 8. Insert public.order_items records
    const orderItemRows = orderItemsData.map((item) => ({
      order_id: createdOrder.id,
      course_id: item.courseId,
      unit_price: item.unitPrice,
    }));

    const { error: itemsInsertErr } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemRows);

    if (itemsInsertErr) {
      logger.error('Error inserting order items:', itemsInsertErr);
      throw ApiError.internal('Failed to create order items');
    }

    // 9. If Free order, directly enroll and clear cart
    if (isFreeOrder) {
      // Create free payment record
      await supabaseAdmin.from('payments').insert({
        order_id: createdOrder.id,
        student_id: studentId,
        payment_gateway: 'Direct',
        gateway_order_id: `free_${createdOrder.id}`,
        gateway_payment_id: `free_pay_${createdOrder.id}`,
        amount: 0,
        currency: 'INR',
        payment_method: 'Free Enrollment',
        status: 'Success',
      });

      // Enroll in all courses
      for (const item of orderItemsData) {
        await this.enrollmentService.createEnrollment(studentId, item.courseId);
      }

      // Clear from cart
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('student_id', studentId)
        .in('course_id', courseIds);

      return {
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number,
        gatewayOrderId: `free_${createdOrder.id}`,
        amount: 0,
        currency: 'INR',
        keyId: config.razorpay.keyId,
        isFreeOrder: true,
        courses: orderItemsData.map((i) => ({
          id: i.courseId,
          title: i.title,
          price: i.unitPrice,
        })),
      };
    }

    // 10. Paid order: Create Gateway Order via Razorpay
    const razorpayOrder = await RazorpayGateway.createOrder(serverTotalAmount, orderNumber);

    // 11. Insert public.payments record (status = Pending)
    const { error: paymentInsertErr } = await supabaseAdmin.from('payments').insert({
      order_id: createdOrder.id,
      student_id: studentId,
      payment_gateway: 'Razorpay',
      gateway_order_id: razorpayOrder.id,
      amount: serverTotalAmount,
      currency: 'INR',
      status: 'Pending',
    });

    if (paymentInsertErr) {
      logger.error('Error creating pending payment record:', paymentInsertErr);
      throw ApiError.internal('Failed to initialize payment record');
    }

    return {
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      gatewayOrderId: razorpayOrder.id,
      amount: serverTotalAmount,
      currency: 'INR',
      keyId: config.razorpay.keyId,
      isFreeOrder: false,
      courses: orderItemsData.map((i) => ({
        id: i.courseId,
        title: i.title,
        price: i.unitPrice,
      })),
    };
  }

  /**
   * 2. Verify Payment & Execute Post-Payment Enrollment and Cart Clearance
   */
  public async verifyPayment(
    studentId: string,
    dto: VerifyPaymentDto
  ): Promise<{ success: boolean; orderNumber: string; message: string }> {
    const { orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature, paymentMethod } = dto;

    if (!orderId || !gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
      throw ApiError.badRequest('Missing required payment verification parameters');
    }

    // 1. Fetch Order and Payment record
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, student_id, total_amount, status, order_items(course_id, unit_price)')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.student_id !== studentId) {
      throw ApiError.forbidden('Unauthorized access to this order');
    }

    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (payErr || !payment) {
      throw ApiError.notFound('Payment record not found');
    }

    // 2. Idempotency Check: If already marked Success, return gracefully
    if (payment.status === 'Success' && order.status === 'Completed') {
      return {
        success: true,
        orderNumber: order.order_number,
        message: 'Payment already verified and completed.',
      };
    }

    // 3. Verify Gateway Order ID matches
    if (payment.gateway_order_id !== gatewayOrderId) {
      throw ApiError.badRequest('Gateway Order ID mismatch');
    }

    // 4. Verify Cryptographic Signature
    const isValidSignature = RazorpayGateway.verifySignature(
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature
    );

    if (!isValidSignature) {
      // Mark payment & order as failed
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'Failed',
          gateway_payment_id: gatewayPaymentId,
          gateway_signature: gatewaySignature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'Failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      throw ApiError.badRequest('Invalid payment signature. Verification failed.');
    }

    // 5. Update Payment Status to Success
    const { error: payUpdateErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'Success',
        gateway_payment_id: gatewayPaymentId,
        gateway_signature: gatewaySignature,
        payment_method: paymentMethod || 'Razorpay',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (payUpdateErr) {
      logger.error('Error updating payment to Success:', payUpdateErr);
      throw ApiError.internal('Failed to update payment status');
    }

    // 6. Update Order Status to Completed
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'Completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // Dispatch payment successful notification (asynchronous & non-blocking)
    try {
      await NotificationService.createNotification({
        userId: studentId,
        title: 'Payment Successful',
        message: `Your payment of ₹${Number(order.total_amount || 0).toLocaleString('en-IN')} for order #${order.order_number} was completed successfully.`,
        type: 'success',
        category: 'payment',
        actionUrl: '/student/payments',
        sourceId: order.id,
      });
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch payment notification: ${notifErr.message}`);
    }

    // 7. Execute Enrollment for all courses in the order
    const courseIds = (order.order_items || []).map((item: any) => item.course_id);

    for (const courseId of courseIds) {
      try {
        await this.enrollmentService.createEnrollment(studentId, courseId);
      } catch (err: any) {
        // If already enrolled, log and continue safely
        logger.info(`Enrollment creation notice for course ${courseId}: ${err?.message}`);
      }
    }

    // 8. Clear purchased courses from student's Cart
    if (courseIds.length > 0) {
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('student_id', studentId)
        .in('course_id', courseIds);
    }

    return {
      success: true,
      orderNumber: order.order_number,
      message: 'Payment verified successfully and enrollment granted.',
    };
  }

  /**
   * 3. Get Student Payment History
   */
  public async getStudentPaymentHistory(studentId: string): Promise<PaymentHistoryItem[]> {
    const { data: rows, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        order_id,
        amount,
        currency,
        payment_method,
        payment_gateway,
        status,
        gateway_payment_id,
        created_at,
        orders (
          order_number,
          order_items (
            unit_price,
            courses (
              id,
              title,
              thumbnail,
              profiles:instructor_id (
                full_name
              )
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student payment history:', error);
      throw ApiError.internal('Failed to retrieve payment history');
    }

    return (rows || []).map((row: any) => {
      const order = row.orders;
      const orderItems = order?.order_items || [];

      const courses = orderItems.map((item: any) => ({
        id: item.courses?.id,
        title: item.courses?.title,
        thumbnail: item.courses?.thumbnail,
        instructorName: item.courses?.profiles?.full_name,
        unitPrice: Number(item.unit_price || 0),
      }));

      return {
        id: row.id,
        orderId: row.order_id,
        orderNumber: order?.order_number || 'N/A',
        amount: Number(row.amount || 0),
        currency: row.currency || 'INR',
        paymentMethod: row.payment_method || 'Online Payment',
        paymentGateway: row.payment_gateway || 'Razorpay',
        status: row.status,
        gatewayPaymentId: row.gateway_payment_id,
        paidAt: row.created_at,
        courses,
      };
    });
  }

  /**
   * 4. Admin Payment Management: Get all payments, summary stats, periodic revenue, and instructor earnings
   */
  public async getAdminPayments(): Promise<{
    summary: {
      totalPaidAmount: number;
      successfulPaymentsCount: number;
      pendingPaymentsCount: number;
      failedPaymentsCount: number;
      totalTransactionsCount: number;
      todayRevenueINR: number;
      weeklyRevenueINR: number;
      monthlyRevenueINR: number;
      yearlyRevenueINR: number;
      platformEarningsINR: number;
      platformCommissionPercent?: number;
      platformCommissionRate?: number;
      instructorEarningsINR: number;
    };
    payments: any[];
    instructorEarnings: any[];
  }> {
    const { data: rows, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        order_id,
        student_id,
        amount,
        currency,
        payment_method,
        payment_gateway,
        status,
        gateway_order_id,
        gateway_payment_id,
        created_at,
        student:student_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        orders (
          order_number,
          status,
          order_items (
            unit_price,
            courses (
              id,
              title,
              thumbnail,
              instructor_id,
              instructor:instructor_id (
                id,
                full_name,
                avatar_url,
                payout_info
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching admin payments:', error);
      console.error('[getAdminPayments] Supabase error:', JSON.stringify({
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      }, null, 2));
      throw ApiError.internal(`Failed to retrieve admin payment records: ${error.message}`);
    }

    let totalPaidAmount = 0;
    let successfulPaymentsCount = 0;
    let pendingPaymentsCount = 0;
    let failedPaymentsCount = 0;

    let todayRevenueINR = 0;
    let weeklyRevenueINR = 0;
    let monthlyRevenueINR = 0;
    let yearlyRevenueINR = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Map to aggregate instructor earnings dynamically from real successful purchases
    const instructorEarningsMap = new Map<
      string,
      {
        instructorId: string;
        instructorName: string;
        avatar: string;
        payoutInfo: any;
        coursesSet: Set<string>;
        studentsSet: Set<string>;
        totalRevenueINR: number;
      }
    >();

    const formattedPayments = (rows || []).map((row: any) => {
      const student = row.student;
      const order = row.orders;
      const orderItems = order?.order_items || [];
      const numAmount = Number(row.amount || 0);

      if (row.status === 'Success' || row.status === 'Completed') {
        successfulPaymentsCount++;
        totalPaidAmount += numAmount;

        const paymentDate = new Date(row.created_at);
        const paymentTime = paymentDate.getTime();

        if (paymentTime >= todayStart) {
          todayRevenueINR += numAmount;
        }
        if (paymentTime >= sevenDaysAgo) {
          weeklyRevenueINR += numAmount;
        }
        if (paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth) {
          monthlyRevenueINR += numAmount;
        }
        if (paymentDate.getFullYear() === currentYear) {
          yearlyRevenueINR += numAmount;
        }

        // Aggregate Instructor earnings
        for (const item of orderItems) {
          const course = item.courses;
          const instructor = course?.instructor;
          if (instructor && instructor.id) {
            const instructorId = instructor.id;
            const existing = instructorEarningsMap.get(instructorId) || {
              instructorId,
              instructorName: instructor.full_name || 'Instructor',
              avatar: instructor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              payoutInfo: instructor.payout_info || null,
              coursesSet: new Set<string>(),
              studentsSet: new Set<string>(),
              totalRevenueINR: 0,
            };

            if (instructor.payout_info) {
              existing.payoutInfo = instructor.payout_info;
            }
            if (course.id) existing.coursesSet.add(course.id);
            if (row.student_id) existing.studentsSet.add(row.student_id);
            existing.totalRevenueINR += Number(item.unit_price || numAmount || 0);

            instructorEarningsMap.set(instructorId, existing);
          }
        }
      } else if (row.status === 'Pending') {
        pendingPaymentsCount++;
      } else if (row.status === 'Failed') {
        failedPaymentsCount++;
      }

      const courses = orderItems.map((item: any) => ({
        id: item.courses?.id,
        title: item.courses?.title,
        thumbnail: item.courses?.thumbnail,
        instructorName: item.courses?.instructor?.full_name,
        unitPrice: Number(item.unit_price || 0),
      }));

      const firstCourse = courses[0];

      return {
        id: row.id,
        orderId: row.order_id,
        orderNumber: order?.order_number || 'N/A',
        studentId: row.student_id,
        studentName: student?.full_name || 'EduSphere Student',
        studentEmail: student?.email || 'N/A',
        studentAvatar: student?.avatar_url || '',
        courseId: firstCourse?.id || '',
        courseName: courses.map((c: any) => c.title).join(', ') || 'Course Purchase',
        instructorName: firstCourse?.instructorName || 'Instructor',
        amount: numAmount,
        currency: row.currency || 'INR',
        paymentMethod: row.payment_method || 'Razorpay',
        paymentGateway: row.payment_gateway || 'Razorpay',
        status: row.status,
        gatewayOrderId: row.gateway_order_id,
        gatewayPaymentId: row.gateway_payment_id,
        createdAt: row.created_at,
        courses,
      };
    });

    // Dynamic platform commission rate from settings
    const commissionRate = await settingsService.getCommissionRate();
    const platformCommissionPercent = Math.round(commissionRate * 100);

    // Format instructor earnings with dynamic Platform / Instructor split and real persistent payouts deduction
    const instructorEarningsList = Array.from(instructorEarningsMap.values()).map((ins) => {
      const gross = ins.totalRevenueINR;
      const platformCommissionINR = Math.round(gross * commissionRate);
      const instructorEarningsINR = gross - platformCommissionINR;
      
      // Calculate total paid amount from persistent payout history
      const payoutInfo = ins.payoutInfo || {};
      const history: any[] = Array.isArray(payoutInfo.payoutHistory) ? payoutInfo.payoutHistory : [];
      let totalPaidAmountINR = 0;
      for (const p of history) {
        if (p.status === 'Paid') {
          totalPaidAmountINR += Number(p.amount || 0);
        }
      }
      const pendingBalanceINR = Math.max(0, instructorEarningsINR - totalPaidAmountINR);
      const payoutStatus = pendingBalanceINR > 0 ? 'Pending' : (totalPaidAmountINR > 0 ? 'Paid' : 'No Dues');

      return {
        instructorId: ins.instructorId,
        instructorName: ins.instructorName,
        avatar: ins.avatar,
        payoutInfo: ins.payoutInfo,
        totalCourses: ins.coursesSet.size,
        totalStudents: ins.studentsSet.size,
        totalRevenueINR: gross,
        platformCommissionINR,
        platformCommissionPercent,
        platformCommissionRate: commissionRate,
        instructorEarningsINR,
        totalPaidAmountINR,
        pendingBalanceINR,
        payoutStatus,
        payoutHistory: history,
      };
    });

    const platformEarningsINR = Math.round(totalPaidAmount * commissionRate);
    const instructorEarningsINR = totalPaidAmount - platformEarningsINR;

    return {
      summary: {
        totalPaidAmount,
        successfulPaymentsCount,
        pendingPaymentsCount,
        failedPaymentsCount,
        totalTransactionsCount: formattedPayments.length,
        todayRevenueINR,
        weeklyRevenueINR,
        monthlyRevenueINR,
        yearlyRevenueINR,
        platformEarningsINR,
        platformCommissionPercent,
        platformCommissionRate: commissionRate,
        instructorEarningsINR,
      },
      payments: formattedPayments,
      instructorEarnings: instructorEarningsList,
    };
  }
}
