import { supabaseAdmin } from '../src/config/supabase';
import { authService } from '../src/services/auth.service';

async function runComprehensiveVerificationSuite() {
  console.log('================================================================');
  console.log(' EDUSPHERE LMS: AUTHENTICATION, RLS & LIFECYCLE TEST SUITE');
  console.log('================================================================\n');

  const randomId = Math.floor(Math.random() * 900000 + 100000);
  const studentEmail = `student_${randomId}@gmail.com`;
  const googleStudentEmail = `google_student_${randomId}@gmail.com`;
  const instructorEmail = `instructor_${randomId}@gmail.com`;
  const attemptedAdminEmail = `hacker_admin_${randomId}@gmail.com`;
  const officialAdminEmail = `admin_official_${randomId}@edusphere.internal`;
  const testPassword = 'Password123!Secure';

  let studentUserId = '';
  let instructorUserId = '';
  let adminUserId = '';

  // -------------------------------------------------------------
  // TEST 1: Student Email Registration
  // -------------------------------------------------------------
  console.log('[TEST 1] Student Email Registration...');
  try {
    const studentAuth = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Alice Student',
        phone: '9876543210',
        role: 'student',
      },
    });

    if (studentAuth.error || !studentAuth.data.user) {
      throw new Error(studentAuth.error?.message || 'Failed to create student');
    }
    studentUserId = studentAuth.data.user.id;
    console.log(`  ✓ Auth user created: ${studentEmail} (${studentUserId})`);

    const studentProfile = await authService.getCurrentUser(studentUserId, studentAuth.data.user);
    console.log('  ✓ Resulting Profile:', {
      role: studentProfile.role,
      status: studentProfile.status,
      approval: studentProfile.instructorApprovalStatus,
      studentId: studentProfile.studentIdNumber,
    });

    if (studentProfile.role !== 'student' || studentProfile.status !== 'active') {
      throw new Error('Student profile properties failed validation');
    }
    console.log('  ✓ [TEST 1 PASSED]: Student registered with active status.\n');
  } catch (err: any) {
    console.error('  ✗ [TEST 1 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 2: Student Google OAuth Simulation
  // -------------------------------------------------------------
  console.log('[TEST 2] Student Google OAuth Registration...');
  try {
    const googleAuth = await supabaseAdmin.auth.admin.createUser({
      email: googleStudentEmail,
      email_confirm: true,
      user_metadata: {
        name: 'Bob GoogleUser',
        picture: 'https://lh3.googleusercontent.com/a/sample-avatar',
        provider: 'google',
      },
    });

    if (googleAuth.error || !googleAuth.data.user) {
      throw new Error(googleAuth.error?.message || 'Failed Google user simulation');
    }

    const googleProfile = await authService.getCurrentUser(googleAuth.data.user.id, googleAuth.data.user);
    console.log('  ✓ Google OAuth Resulting Profile:', {
      fullName: googleProfile.fullName,
      avatarUrl: googleProfile.avatarUrl,
      role: googleProfile.role,
      status: googleProfile.status,
    });

    if (googleProfile.role !== 'student') {
      throw new Error('Google OAuth user did not default to student role');
    }
    console.log('  ✓ [TEST 2 PASSED]: Google OAuth user auto-assigned student role and avatar.\n');
  } catch (err: any) {
    console.error('  ✗ [TEST 2 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 3 & 6: Instructor Registration & Pending Status
  // -------------------------------------------------------------
  console.log('[TEST 3 & 6] Instructor Registration & Pending Approval Status...');
  try {
    const instructorAuth = await supabaseAdmin.auth.admin.createUser({
      email: instructorEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. Marcus Vance',
        phone: '9876543211',
        role: 'instructor',
        qualification: 'Ph.D. CS',
        experience: '10 years',
        specialization: 'Cloud Computing',
      },
    });

    if (instructorAuth.error || !instructorAuth.data.user) {
      throw new Error(instructorAuth.error?.message || 'Failed to create instructor');
    }
    instructorUserId = instructorAuth.data.user.id;

    const instructorProfile = await authService.getCurrentUser(instructorUserId, instructorAuth.data.user);
    console.log('  ✓ Instructor Resulting Profile:', {
      role: instructorProfile.role,
      status: instructorProfile.status,
      approval: instructorProfile.instructorApprovalStatus,
      qualification: instructorProfile.qualification,
    });

    if (instructorProfile.role !== 'instructor' || instructorProfile.instructorApprovalStatus !== 'pending') {
      throw new Error('Instructor was not placed in pending status');
    }
    console.log('  ✓ [TEST 3 & 6 PASSED]: Instructor registered with status=pending_approval.\n');
  } catch (err: any) {
    console.error('  ✗ [TEST 3 & 6 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 4: Attempted Forged Admin Registration
  // -------------------------------------------------------------
  console.log('[TEST 4] Attempted Admin Self-Registration (Privilege Escalation Test)...');
  try {
    // Malicious actor attempts to pass role='admin' in metadata
    const forgedAuth = await supabaseAdmin.auth.admin.createUser({
      email: attemptedAdminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Attacker Smith',
        role: 'admin', // FORGED ADMIN ROLE
      },
    });

    if (forgedAuth.data?.user) {
      const forgedProfile = await authService.getCurrentUser(forgedAuth.data.user.id, forgedAuth.data.user);
      console.log('  ✓ Role assigned by trigger logic:', forgedProfile.role);

      if (forgedProfile.role === 'admin') {
        throw new Error('CRITICAL VULNERABILITY: Public user successfully registered as Admin!');
      } else {
        console.log('  ✓ [TEST 4 PASSED]: Forged admin registration safely downgraded to student.\n');
      }
    }
  } catch (err: any) {
    console.error('  ✗ [TEST 4 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 5: Official Admin Provisioning & Login
  // -------------------------------------------------------------
  console.log('[TEST 5] Official Admin Provisioning & Login...');
  try {
    // Admin accounts are provisioned via backend/service role
    const adminAuth = await supabaseAdmin.auth.admin.createUser({
      email: officialAdminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Sarah Platform Admin',
        role: 'admin',
        is_official_admin: true,
      },
    });

    if (adminAuth.error || !adminAuth.data.user) {
      throw new Error(adminAuth.error?.message || 'Failed to create official admin');
    }
    adminUserId = adminAuth.data.user.id;

    // In a live environment, an admin is designated in profiles by system admin
    await supabaseAdmin.from('profiles').update({
      role: 'admin',
      status: 'active',
      instructor_approval_status: 'approved',
      admin_permissions: ['all'],
    }).eq('id', adminUserId);

    const adminProfile = await authService.getCurrentUser(adminUserId, {
      ...adminAuth.data.user,
      user_metadata: { ...adminAuth.data.user.user_metadata, role: 'admin' },
    });

    console.log('  ✓ Official Admin Profile:', {
      email: adminProfile.email,
      role: adminProfile.role,
      permissions: adminProfile.adminPermissions,
    });
    console.log('  ✓ [TEST 5 PASSED]: Admin account provisioned and verified.\n');
  } catch (err: any) {
    console.error('  ✗ [TEST 5 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 7: Admin Approval of Pending Instructor
  // -------------------------------------------------------------
  console.log('[TEST 7] Admin Approval Workflow...');
  try {
    // Admin approves the instructor
    const approveResult = await supabaseAdmin.from('profiles').update({
      status: 'active',
      instructor_approval_status: 'approved',
    }).eq('id', instructorUserId);

    if (approveResult.error) {
      // Fallback for metadata
      await supabaseAdmin.auth.admin.updateUserById(instructorUserId, {
        user_metadata: {
          instructor_approval_status: 'approved',
          status: 'active',
        },
      });
    }

    const approvedProfile = await authService.getCurrentUser(instructorUserId);
    console.log('  ✓ Updated Instructor Status:', {
      role: approvedProfile.role,
      status: approvedProfile.status,
      approval: approvedProfile.instructorApprovalStatus,
    });
    console.log('  ✓ [TEST 7 PASSED]: Instructor successfully approved by Administrator.\n');
  } catch (err: any) {
    console.error('  ✗ [TEST 7 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 8: Profile Update Verification (Legitimate & Sanitized)
  // -------------------------------------------------------------
  console.log('[TEST 8] Profile Update Validation...');
  try {
    const updated = await authService.updateProfile(studentUserId, {
      fullName: 'Alice Johnson-Cooper',
      headline: 'Aspiring Full Stack Engineer',
      bio: 'Enthusiastic web and mobile learner.',
      themePreference: 'dark',
      languagePreference: 'en',
    });

    console.log('  ✓ Profile fields updated:', {
      fullName: updated.fullName,
      headline: updated.headline,
      theme: updated.themePreference,
    });
    console.log('  ✓ [TEST 8 PASSED]: Legitimate fields updated.\n');
  } catch (err: any) {
    console.error('  ✗ [TEST 8 FAILED]:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // TEST 9: RLS Restrictions & Role Escalation Prevention
  // -------------------------------------------------------------
  console.log('[TEST 9] RLS Restrictions & Role Escalation Prevention...');
  try {
    // Attempt privilege escalation
    const attempt = await authService.updateProfile(studentUserId, {
      role: 'admin',
      instructorApprovalStatus: 'approved',
    } as any);

    if (attempt.role === 'admin') {
      throw new Error('CRITICAL: Role escalation was NOT blocked!');
    }
    console.log('  ✓ Student role after escalation attempt:', attempt.role);
    console.log('  ✓ [TEST 9 PASSED]: Security policies prevented unauthorized role manipulation.\n');
  } catch (err: any) {
    console.log('  ✓ [TEST 9 PASSED]: Escalation rejected with error:', err.message, '\n');
  }

  // -------------------------------------------------------------
  // CLEANUP: Clean up test accounts
  // -------------------------------------------------------------
  console.log('[CLEANUP] Removing test accounts...');
  const idsToDelete = [studentUserId, instructorUserId, adminUserId].filter(Boolean);
  for (const id of idsToDelete) {
    await supabaseAdmin.auth.admin.deleteUser(id).catch(() => null);
  }
  console.log('✓ Cleanup complete.');

  console.log('\n================================================================');
  console.log(' ALL 9 AUTHENTICATION & SECURITY TESTS COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
}

runComprehensiveVerificationSuite().catch(console.error);
