export default function MinimalDashboard() {
  console.log("🔥 MINIMAL DASHBOARD RENDERED")
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightgreen', minHeight: '400px' }}>
      <h1 style={{ color: 'black', fontSize: '24px' }}>TEST DASHBOARD - LOADING WORKS</h1>
      <p>If you can see this, routing works and the issue is in the complex dashboard component.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
