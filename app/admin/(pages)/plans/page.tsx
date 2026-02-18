import { Suspense } from 'react'
import { getPlans } from './actions'
import PlansTable from './_components/PlansTable'
import { CreatePlanDialog } from './_components/CreatePlanDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const sortBy = params.sortBy as string || 'createdAt'
  const sortOrder = params.sortOrder as 'asc' | 'desc' || 'desc'
  const search = params.search as string

  const plansData = await getPlans({
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Plan Management</h1>
        <CreatePlanDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </CreatePlanDialog>
      </div>

      <Suspense fallback={<div>Loading plans...</div>}>
        <PlansTable initialData={plansData} />
      </Suspense>
    </div>
  )
}