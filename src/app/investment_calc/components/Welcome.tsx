import React from 'react'
import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PaidIcon from '@mui/icons-material/Paid';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import PercentIcon from '@mui/icons-material/Percent';
import DifferenceIcon from '@mui/icons-material/Difference';
import PaymentIcon from '@mui/icons-material/Payment';
import SavingsIcon from '@mui/icons-material/Savings';
import Button  from './Button';
import HomeIcon from '@mui/icons-material/Home';
import VillaIcon from '@mui/icons-material/Villa';

const steps = [
  {
    icon: <CreditScoreIcon />,
    text: 'Loan Terms',
  },
  {
    icon: <PriceCheckIcon />,
    text: 'Rent Revenue',
  },
  {
    icon: <PaidIcon />,
    text: 'Financing Expenses',
  },
  {
    icon: <PercentIcon />,
    text: 'Principal Monthly Interest',
  },
  {
    icon: <DifferenceIcon />,
    text: 'Debt-to-Income Ratios & Reserve Requirements',
  },
  {
    icon: <SavingsIcon />,
    text: 'User Financial Situation',
  },
  {
    icon: <PaymentIcon />,
    text: 'User Monthly Debt Payments',
  },
]

interface IWelcomeProps {
  onStart: () => void;
}

const Welcome = ({ onStart }: IWelcomeProps) => {
  return (
    <Box className="">
      <Typography className="text-center font-medium" variant="h2">Investment Recommender</Typography>
      <Typography className="text-center text-black text-sm mt-2" variant="body1">
        You will need to finish the following questions to get your investment recommendation.
      </Typography>
      <Box className="w-[400px] max-w-full mx-auto mt-8">
        <Box className="w-[400px] max-w-full p-7 bg-gradient-to-r from-blue-100 to-blue-200 rounded-[25px]">
          <Stepper activeStep={-1} orientation="vertical">
            {steps.map(({ text, icon }, index) => (
              <Step key={index}>
                <StepLabel className="text-blue-500" icon={icon}>
                  {text}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>
      <Box className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 mt-8 mx-auto">
        <Button
          onClick={onStart}
          startIcon={<HomeIcon />}
          className="w-[240px] max-w-full"
        >
          Single Family Asset
        </Button>
        <Button
          onClick={onStart}
          startIcon={<VillaIcon />}
          className="w-[240px] max-w-full"
        >
          Multi-family Asset
        </Button>
      </Box>
    </Box>
  )
}

export default Welcome