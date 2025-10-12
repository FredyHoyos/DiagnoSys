import { Target } from 'lucide-react'
import React from 'react'
import TargetForm from '@/app/components/targetForm'

const page = () => {
  return (
    <div>
      <TargetForm formsCount={4} categoriesCount={8} itemsCount={15} />
    </div>
  )
}

export default page
