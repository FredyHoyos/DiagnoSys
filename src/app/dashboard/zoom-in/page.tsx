import { Target } from 'lucide-react'
import React from 'react'
import TargetForm from '@/app/components/targetForm'
import TargetForm2 from '@/app/components/targetForm2'

const page = () => {
  return (
    <div>
      <TargetForm formsCount={4} categoriesCount={8} itemsCount={15} />
      <TargetForm2 />
    </div>
  )
}

export default page
