const token = process.argv[2] || 'a5e470da70048ba4989531df097c3438071088e917b816635db3d4a1b0f4a7f1';

const verifyRes = await fetch(`http://localhost:5000/api/auth/verify/${token}`);
console.log('Verify status:', verifyRes.status);
console.log('Verify body:', await verifyRes.text());

const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'delivered@resend.dev', password: 'testpass123' })
});
console.log('Login status:', loginRes.status);
console.log('Login body:', await loginRes.text());
