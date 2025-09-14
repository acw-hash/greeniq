export default function MinimalDashboard() {
  console.log("🔥 MINIMAL DASHBOARD RENDERED")
  
  return (
    <div className="p-6">
      <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-4">
        <h1 className="text-xl font-bold text-green-800 mb-2">
          ✅ Dashboard Loading Successfully!
        </h1>
        <p className="text-green-700">
          Sign in is working. You can now test the sign out functionality.
        </p>
        <p className="text-sm text-green-600 mt-2">
          Rendered at: {new Date().toLocaleString()}
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Dashboard Content</h2>
        <p className="text-blue-700">
          This is your dashboard. Use the header navigation to sign out and test that flow.
        </p>
      </div>
    </div>
  )
}