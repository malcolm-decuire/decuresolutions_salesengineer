import Input from '@/components/Input';
import { Box } from '@mui/material';
import React from 'react'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface IDeptToIncomeAndReserveCalculatedValues {
  frontendDebtToIncomeRatioPercentage: number;
  backendDebtToIncomeRatioPercentage: number;
  reserveRequirement: number;
  rentRevenueAdjustmentPercentage: number;
  additionalIncomeForAffordabilityCalculation: number;
}

interface IDeptToIncomeAndReserveProps {
  data: IDeptToIncomeAndReserveCalculatedValues;
}

const DeptToIncomeAndReserve = ({ data }: IDeptToIncomeAndReserveProps) => {
  const {
    frontendDebtToIncomeRatioPercentage,
    backendDebtToIncomeRatioPercentage,
    reserveRequirement,
    rentRevenueAdjustmentPercentage,
    additionalIncomeForAffordabilityCalculation,
  } = data;
  return (
    <>
      <Box className="min-h-[60px] bg-yellow-500 w-full mb-4 rounded-xl flex justify-center items-center py-4 px-8 text-center">
        Edit this page to update recommender for both single family & multifamily
      </Box>
      <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
        <Box className="flex items-center">
          <WarningAmberIcon className="text-yellow-500 mr-2" />
          <span className="text-sm">Customize the different ratios depending on your lending scenario</span>
        </Box>
        <Box className="w-full md:w-calc-1/2-4">
          <Input
            className="w-full"
            placeholder="Front-End Debt-To-Income Ratio by Banks(%)"
            value={frontendDebtToIncomeRatioPercentage}
          />
        </Box>
        <Box className="w-full md:w-calc-1/2-4">
          <Input
            className="w-full"
            placeholder="Back-End Debt-To-Income Ratio by Banks(%)"
            value={backendDebtToIncomeRatioPercentage}
          />
        </Box>
        <Box className="w-full md:w-calc-1/2-4">
          <Input
            className="w-full"
            placeholder="Reserve Requirement (Months)"
            value={reserveRequirement}
          />
        </Box>
        <Box className="w-full md:w-calc-1/2-4">
          <Input
            className="w-full"
            placeholder="Rent Revenue Adjustment By Banks(%)"
            value={rentRevenueAdjustmentPercentage}
          />
        </Box>
        <Box className="w-full md:w-calc-1/2-4">
          <Input
            className="w-full"
            placeholder="Additional Income For Affordability Calculation"
            value={additionalIncomeForAffordabilityCalculation}
          />
        </Box>
      </Box>
    </>
  )
}

export default DeptToIncomeAndReserve