import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePricing } from "@/hooks/usePricing"
import { Zap, TrendingUp, Calendar, CreditCard } from "lucide-react"

export function UsageDashboard() {
  const { userPlan, tokenUsage, loading } = usePricing()

  if (loading || !userPlan) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const usagePercentage = (userPlan.tokens_used / userPlan.tokens_included) * 100
  const recentUsage = tokenUsage.slice(0, 5)
  const monthlyUsage = tokenUsage.reduce((acc, usage) => {
    const date = new Date(usage.created_at)
    const month = date.getMonth()
    const currentMonth = new Date().getMonth()
    if (month === currentMonth) {
      acc += usage.tokens_used
    }
    return acc
  }, 0)

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-500'
      case 'basic': return 'bg-blue-500'
      case 'pro': return 'bg-purple-500'
      case 'enterprise': return 'bg-gold-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={`${getPlanColor(userPlan.plan_type)} text-white`}>
                {userPlan.plan_type.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {userPlan.billing_cycle}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {userPlan.tokens_included.toLocaleString()} tokens included
            </p>
          </CardContent>
        </Card>

        {/* Token Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPlan.tokens_remaining.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {userPlan.tokens_used.toLocaleString()} / {userPlan.tokens_included.toLocaleString()} used
            </p>
            <Progress value={usagePercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyUsage.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              tokens consumed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsage.length > 0 ? (
            <div className="space-y-3">
              {recentUsage.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="capitalize">
                      {usage.action_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {usage.model_used}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {usage.tokens_used.toLocaleString()} tokens
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(usage.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No usage data yet</p>
              <p className="text-sm text-muted-foreground">
                Start generating prompts to see your activity here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Token Warning */}
      {usagePercentage > 80 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">
                  {usagePercentage > 95 ? 'Almost out of tokens!' : 'Running low on tokens'}
                </h3>
                <p className="text-sm text-orange-700">
                  You've used {usagePercentage.toFixed(1)}% of your monthly tokens. 
                  Consider upgrading your plan or adding your own API key.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
