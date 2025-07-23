import { useQuery } from 'react-query'
import { 
  Users, 
  Store, 
  Building2, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { dashboardApi } from '@/services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    dashboardApi.getOverview
  )

  const { data: financial, isLoading: financialLoading } = useQuery(
    'dashboard-financial',
    dashboardApi.getFinancial
  )

  const { data: userActivity, isLoading: userActivityLoading } = useQuery(
    'dashboard-user-activity',
    dashboardApi.getUserActivity
  )

  if (overviewLoading || financialLoading || userActivityLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Users',
      value: overview?.overview?.totalUsers || 0,
      change: '+12%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Active Tenants',
      value: overview?.overview?.activeTenants || 0,
      change: '+5%',
      changeType: 'positive',
      icon: Store,
    },
    {
      name: 'Total Malls',
      value: overview?.overview?.totalMalls || 0,
      change: '+2%',
      changeType: 'positive',
      icon: Building2,
    },
    {
      name: 'Work Permits',
      value: overview?.overview?.totalWorkPermits || 0,
      change: '-3%',
      changeType: 'negative',
      icon: FileText,
    },
  ]

  const monthlyRevenue = financial?.monthlyRevenue || []
  const roleStats = userActivity?.roleStats || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your mall operations today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value.toLocaleString()}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {stat.changeType === 'positive' ? (
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Revenue</h3>
            <p className="card-description">Revenue trends over the last 6 months</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Role Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Role Distribution</h3>
            <p className="card-description">Breakdown of users by role</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {roleStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Users']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Work Permits */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Work Permits</h3>
            <p className="card-description">Latest work permit applications</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {overview?.recentActivities?.workPermits?.map((permit: any) => (
                <div key={permit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{permit.permitNumber}</p>
                    <p className="text-xs text-gray-500">{permit.type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      permit.status === 'ACTIVE' ? 'bg-success-100 text-success-800' :
                      permit.status === 'PENDING_APPROVAL' ? 'bg-warning-100 text-warning-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {permit.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(permit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Security Incidents */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Security Incidents</h3>
            <p className="card-description">Latest security reports</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {overview?.recentActivities?.securityIncidents?.map((incident: any) => (
                <div key={incident.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{incident.incidentNumber}</p>
                    <p className="text-xs text-gray-500">{incident.type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.severity === 'HIGH' ? 'bg-danger-100 text-danger-800' :
                      incident.severity === 'MEDIUM' ? 'bg-warning-100 text-warning-800' :
                      'bg-success-100 text-success-800'
                    }`}>
                      {incident.severity}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(incident.incidentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">Common tasks and shortcuts</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button className="flex flex-col items-center p-4 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Users className="h-8 w-8 text-primary-600 mb-2" />
              Add User
            </button>
            <button className="flex flex-col items-center p-4 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Store className="h-8 w-8 text-primary-600 mb-2" />
              Register Tenant
            </button>
            <button className="flex flex-col items-center p-4 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Building2 className="h-8 w-8 text-primary-600 mb-2" />
              Add Mall
            </button>
            <button className="flex flex-col items-center p-4 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Activity className="h-8 w-8 text-primary-600 mb-2" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 