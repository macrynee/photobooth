async function runAuthTests() {
  const baseUrl = 'http://localhost:5000';
  console.log('🧪 Starting Authentication Backend Test Suite...\n');

  // Test 1: Register New User
  console.log('1️⃣ Testing Registration: POST /api/auth/register...');
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testoperator_' + Math.random().toString(36).substring(2, 6),
      email: `operator_${Date.now()}@snapbox.local`,
      password: 'password123',
    }),
  });
  const regData = await regRes.json();
  console.log(`Status: ${regRes.status}`, regData.success ? '✅ Success' : '❌ Failed', regData);

  // Test 2: Login with Registered User
  if (regData.user) {
    console.log('\n2️⃣ Testing Login with registered credentials: POST /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: regData.user.username,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`, loginData.success ? '✅ Success' : '❌ Failed', {
      tokenReceived: !!loginData.token,
      user: loginData.user,
    });

    // Test 3: Authenticated Profile Fetch
    console.log('\n3️⃣ Testing Protected Route: GET /api/auth/me (with JWT Bearer token)...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const meData = await meRes.json();
    console.log(`Status: ${meRes.status}`, meData.success ? '✅ Success' : '❌ Failed', meData.user);
  }

  // Test 4: Login with Main Admin (mac / macqwerty)
  console.log('\n4️⃣ Testing Admin Login: POST /api/auth/login (mac / macqwerty)...');
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'mac',
      password: 'macqwerty',
    }),
  });
  const adminData = await adminRes.json();
  console.log(`Status: ${adminRes.status}`, adminData.success ? '✅ Success' : '❌ Failed', {
    admin: adminData.user || adminData.admin,
    tokenReceived: !!adminData.token,
  });

  // Test 5: Reject Bad Password
  console.log('\n5️⃣ Testing Bad Password Rejection...');
  const badRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'mac',
      password: 'wrongpassword',
    }),
  });
  const badData = await badRes.json();
  console.log(`Status: ${badRes.status} (Expected 401)`, badRes.status === 401 ? '✅ Correctly Rejected' : '❌ Failed', badData);

  console.log('\n✨ All Authentication Backend Tests Completed!');
}

runAuthTests().catch(console.error);
