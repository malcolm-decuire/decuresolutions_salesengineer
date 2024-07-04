///////////////////////////////////////
//20240704 bad coding habits die hard
////////////////////////////////////

// 'use client'
// import { Box } from '@mui/material'
// import React from 'react'

// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableHead from '@mui/material/TableHead';
// import TableRow from '@mui/material/TableRow';
// import Paper from '@mui/material/Paper';
// import jsPDF from 'jspdf'
// import autoTable from 'jspdf-autotable'
// import GetAppIcon from '@mui/icons-material/GetApp';
// import Button from './Button';
// import { pv, pmt } from 'financial'
// // import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// // import CancelIcon from '@mui/icons-material/Cancel';

// const doc = new jsPDF()

// const formatAmount = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

// const IconYesNo = ({ value }: { value: string }) => {

//   // if (value === 'YES') {
//   //   return <CheckCircleIcon className="text-green-500 float-right" />
//   // }

//   // if (value === 'NO') {
//   //   return <CancelIcon className="text-red-500 float-right" />
//   // }

//   return value
// }

// const Summary = ({ data }: { data: Record<any, any> }) => {
//   const monthlyGrossIncomeValue2 = data.monthlyGrossIncome + (data.rentRevenueAdjustmentPercentage / 100) * data.rentSum;
//   const singleMortageRatio = (data.PITI / data.monthlyGrossIncome) * 100;
//   const doubleMortageRatio = (data.PITI / monthlyGrossIncomeValue2) * 100;
//   const maxAvaliableForOtherDebtPayment = data.backendDebtToIncomeRatioPercentage - singleMortageRatio;
//   const doubleMaxAvailableForOtherDebtPayment = data.backendDebtToIncomeRatioPercentage - doubleMortageRatio;
//   const singleBackendDeptToIcomeRatioAllDepts = ((data.totalMonthlyDebtPayments + data.PITI) * 100) / data.monthlyGrossIncome;
//   const doubleBackendDeptToIcomeRatioAllDepts = ((data.totalMonthlyDebtPayments + data.PITI) * 100) / monthlyGrossIncomeValue2;
//   const singleMaximumMonthlyMortageAmount = (data.backendDebtToIncomeRatioPercentage / 100) * data.monthlyGrossIncome - data.totalMonthlyDebtPayments;
//   const doubleMaximumMonthlyMortageAmount = (data.backendDebtToIncomeRatioPercentage / 100) * monthlyGrossIncomeValue2 - data.totalMonthlyDebtPayments;
//   const singleMaximumMortageAmount = -pv((data.interestRate / 100) / 12, data.numberOfPayments, singleMaximumMonthlyMortageAmount);
//   const doubleMaximumMortageAmount = -pv((data.interestRate / 100) / 12, data.numberOfPayments, doubleMaximumMonthlyMortageAmount);
//   const singleDownPayment035 = (singleMaximumMortageAmount / (1 - data.downPaymentPercentage / 100)) - singleMaximumMortageAmount;
//   const doubleDownPayment035 = (doubleMaximumMortageAmount / (1 - data.downPaymentPercentage / 100)) - doubleMaximumMortageAmount;
//   const singleMaxHomeValueYouCanBePreApprovedFor = singleMaximumMortageAmount + singleDownPayment035;
//   const doubleMaxHomeValueYouCanBePreApprovedFor = doubleMaximumMortageAmount + doubleDownPayment035;
//   const singleMortageForThisHome = -1 * pmt(data.interestRate / 100 / 12, 360, singleMaxHomeValueYouCanBePreApprovedFor * (1 - data.downPaymentPercentage / 100));
//   const doubleMortageForThisHome = -1 * pmt(data.interestRate / 100 / 12, 360, doubleMaxHomeValueYouCanBePreApprovedFor * (1 - data.downPaymentPercentage / 100));
//   const singleTotalMonthlyPaymentsForThisHome = singleMortageForThisHome + data.monthlyPaymentWPmi;
//   const doubleTotalMonthlyPaymentsForThisHome = doubleMortageForThisHome + data.monthlyPaymentWPmi;
//   const singleReservesAfterUpfrontInvestment = data.yourCurrentSavings - singleDownPayment035;
//   const doubleReservesAfterUpfrontInvestment = data.yourCurrentSavings - doubleDownPayment035;
//   const singleNumberOfReserveMonths = Math.round(singleReservesAfterUpfrontInvestment / singleTotalMonthlyPaymentsForThisHome);
//   const doubleNumberOfReserveMonths = Math.round(doubleReservesAfterUpfrontInvestment / doubleTotalMonthlyPaymentsForThisHome);
//   const recommendationRows = [
//     {
//       name: '7. How Much Can I Afford?',
//       className: 'bg-grey-400 font-bold',
//       value: 'Single Family Home',
//       value2: 'MF w/ 75% Rent Rev'
//     },
//     {
//       name: 'Monthly Gross Income',
//       value: data.monthlyGrossIncome,
//       value2: monthlyGrossIncomeValue2
//     },
//     {
//       name: 'Monthly Debt Obligations (Non-Mortgage)',
//       value: data.totalMonthlyDebtPayments,
//       value2: data.totalMonthlyDebtPayments
//     },
//     {
//       name: 'Front-End Debt-To-Income Ratio (Mortgage Only)',
//       value: `${Number(singleMortageRatio).toFixed(2)}%`,
//       value2: `${Number(doubleMortageRatio).toFixed(2)}%`,
//     },
//     {
//       name: '7a. Do You Meet Front-End DTI Criteria?',
//       className: 'bg-grey-400 font-bold',
//       value: singleMortageRatio < data.frontendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
//       value2: doubleMortageRatio < data.frontendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
//     },
//     {
//       name: 'Maximium % Available for Other Debt Payments',
//       value: `${Number(maxAvaliableForOtherDebtPayment).toFixed(2)}%`,
//       value2: `${Number(doubleMaxAvailableForOtherDebtPayment).toFixed(2)}%`,
//     },
//     {
//       name: 'Maximium $ Available for Other Debt Payment',
//       value: (maxAvaliableForOtherDebtPayment / 100) * data.monthlyGrossIncome,
//       value2: (doubleMaxAvailableForOtherDebtPayment / 100) * monthlyGrossIncomeValue2,
//     },
//     {
//       name: 'Backend-End Debt-To-Income Ratio (All Debts)',
//       value: `${Number(singleBackendDeptToIcomeRatioAllDepts).toFixed(2)}%`,
//       value2: `${Number(doubleBackendDeptToIcomeRatioAllDepts).toFixed(2)}%`,
//     },
//     {
//       name: '7b. Do You Meet Backend-End DTI Criteria?',
//       className: 'bg-grey-400 font-bold',
//       value: singleBackendDeptToIcomeRatioAllDepts < data.backendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
//       value2: doubleBackendDeptToIcomeRatioAllDepts < data.backendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
//     },
//     {
//       name: 'Maximium Monthly Mortgage Amount',
//       value: singleMaximumMonthlyMortageAmount,
//       value2: doubleMaximumMonthlyMortageAmount,
//     },
//     {
//       name: 'Maximum Total Mortgage Amount',
//       value: singleMaximumMortageAmount,
//       value2: doubleMaximumMortageAmount,
//     },
//     {
//       name: '0.035 Downpayment',
//       value: singleDownPayment035,
//       value2: doubleDownPayment035,
//     },
//     {
//       name: 'Max Home Value You Can Be Pre-Approved For',
//       value: singleMaxHomeValueYouCanBePreApprovedFor,
//       value2: doubleMaxHomeValueYouCanBePreApprovedFor,
//     },
//     {
//       name: 'Mortgage For This Home',
//       value: singleMortageForThisHome,
//       value2: doubleMortageForThisHome,
//     },
//     {
//       name: 'Additional Monthly Payments For This Home',
//       value: data.monthlyPaymentWPmi,
//       value2: data.monthlyPaymentWPmi,
//     },
//     {
//       name: 'Total Monthly Payments For This Home',
//       value: singleTotalMonthlyPaymentsForThisHome,
//       value2: doubleTotalMonthlyPaymentsForThisHome,
//     },
//     {
//       name: 'Current Savings',
//       value: data.yourCurrentSavings,
//       value2: data.yourCurrentSavings,
//     },
//     {
//       name: '7c. Can You Make This Downpayment?',
//       className: 'bg-grey-400 font-bold',
//       value: singleDownPayment035 < data.yourCurrentSavings ? 'YES' : 'NO',
//       value2: doubleDownPayment035 < data.yourCurrentSavings ? 'YES' : 'NO',
//     },
//     {
//       name: 'Reserves after Upfront Investment',
//       value: singleReservesAfterUpfrontInvestment,
//       value2: doubleReservesAfterUpfrontInvestment,
//     },
//     {
//       name: '6 Months Reserves Would Be...',
//       value: data.reserveRequirement * singleTotalMonthlyPaymentsForThisHome,
//       value2: data.reserveRequirement * doubleTotalMonthlyPaymentsForThisHome,
//     },
//     {
//       name: '# of Reserve Months',
//       value: singleNumberOfReserveMonths,
//       value2: doubleNumberOfReserveMonths
//     },
//     {
//       name: '7d. Do You Have 6 Months Reserves?',
//       className: 'bg-grey-400 font-bold',
//       value: singleNumberOfReserveMonths > 6 ? 'YES' : 'NO',
//       value2: doubleNumberOfReserveMonths > 6 ? 'YES' : 'NO',
//     },
//   ]

//   const rows = [
//     { name: '1. Loan Terms', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'Home Price', value: data.homePrice, colSpan: 2 },
//     { name: 'Downpayment (%)', value: `${data.downPaymentPercentage}%`, colSpan: 2 },
//     { name: 'Downpayment ($)', value: data.downPaymentAmount, colSpan: 2 },
//     { name: 'Mortgage', value: data.mortgage, colSpan: 2 },
//     { name: 'Interest Rate (per year)', value: `${data.interestRate}%`, colSpan: 2 },
//     { name: 'Terms (Years)', value: `${data.terms}`, colSpan: 2 },
//     { name: '# of Payments', value: `${data.numberOfPayments}`, colSpan: 2 },
//     { name: 'Mortgage Payment (Principal & Interest)', value: data.mortgagePayment, colSpan: 2 },
//     { name: '2. Rent Revenues', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'Unit #1 Rent or Live In', value: data.rentLive, colSpan: 2 },
//     { name: 'Unit #2 Rent', value: data.rent2, colSpan: 2 },
//     { name: 'Unit #3 Rent', value: data.rent3, colSpan: 2 },
//     { name: 'Unit #4 Rent', value: data.rent4, colSpan: 2 },
//     { name: 'Other Revenue (w+d, prkg)', value: data.otherRevenue, colSpan: 2 },
//     { name: 'Rent Revenues sum', value: data.rentSum, colSpan: 2},
//     { name: '2a. Financing Expense', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'Escrow: Taxes', value: data.escrowTaxes, colSpan: 2},
//     { name: `Escrow: Homeowner's Insurance`, value: data.escrowHomeownersInsurance, colSpan: 2},
//     { name: 'Escrow: Hazard Insurance', value: data.escrowHazardInsurance, colSpan: 2},
//     { name: 'Monthly Payment w/o PMI', value: data.monthlyPaymentWoPMI, colSpan: 2},
//     { name: '3b. PMI', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'PMI Expense (%)', value: `${data.pmiExpensePercentage}%`, colSpan: 2},
//     { name: 'PMI Expense ($)', value: data.pmiExpenseAmount, colSpan: 2},
//     { name: 'Monthly Payment w/PMI', value: data.monthlyPaymentWPmi, colSpan: 2},
//     { name: 'P.I.T.I. Principal Interest Taxes Insurance', value: data.PITI, colSpan: 2},
//     { name: '4. Debt-To-Income Ratios & Reserve Requirements', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'Front-End Debt-To-Income Ratio by Banks', value: `${data.frontendDebtToIncomeRatioPercentage}%`, colSpan: 2},
//     { name: 'Back-End Debt-To-Income Ratio by Banks', value: `${data.backendDebtToIncomeRatioPercentage}%`, colSpan: 2},
//     { name: 'Reserve Requirement (Months)', value: data.reserveRequirement, colSpan: 2},
//     { name: 'Rent Revenue Adjustment By Banks', value: `${data.rentRevenueAdjustmentPercentage}%`, colSpan: 2},
//     { name: 'Additional Income For Affordability Calculation', value: data.additionalIncomeForAffordabilityCalculation, colSpan: 2},
//     { name: '5. Your Financial Situation', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'Your Current Rent', value: data.yourCurrentRent, colSpan: 2},
//     { name: 'Your Current Annual Salary / Gross Income', value: data.yourCurrentAnnualSalary, colSpan: 2},
//     { name: 'Monthly Gross Income', value: data.monthlyGrossIncome, colSpan: 2},
//     { name: 'Your Current Savings', value: data.yourCurrentSavings, colSpan: 2},
//     { name: '6. Monthly Debt Payments', colSpan: 3, className: 'bg-grey-400 font-bold'},
//     { name: 'First Home Monthly Mortgage Payment', value: data.firstHomeMonthlyMortgagePayment, colSpan: 2},
//     { name: 'Student Loans Monthly Payment', value: data.studentLoansMonthlyPayment, colSpan: 2},
//     { name: 'Car Note Monthly Payment', value: data.carNoteMonthlyPayment, colSpan: 2},
//     { name: 'Credit Card Payments', value: data.creditCardPayments, colSpan: 2},
//     { name: 'Other Debt Monthly Payment', value: data.otherDebtMonthlyPayment, colSpan: 2},
//     { name: 'Monthly dept payments sum', value: data.totalMonthlyDebtPayments, colSpan: 2},
//   ]

//   return (
//     <Box className="w-[800px] max-w-full mx-auto overflow-auto">
//       <Box className="flex justify-end mb-2">
//         <Button
//           startIcon={<GetAppIcon />}
//           onClick={() => {
//             autoTable(doc, { html: '#my-table', useCss: true})
//             doc.save('table.pdf')
//           }}
//         >
//           Export pdf
//         </Button>
//       </Box>
//       <TableContainer component={Paper}>
//         <Table id="my-table" sx={{ minWidth: 650 }} aria-label="simple table">
//           <TableHead>
//             <TableRow>
//               <TableCell className="bg-green-500 text-white-500 text-center font-bold" colSpan={3}>Recommendation</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {recommendationRows.map(({ name, className, value = '', value2 = '' }, index) => (
//               <TableRow key={index}>
//                 <TableCell className={className} component="th" scope="row">
//                   {name}
//                 </TableCell>
//                 <TableCell className={className} align="right">
//                   {['YES', 'NO'].includes(value) ? (
//                     <IconYesNo value={value} />
//                   ) : (
//                     typeof value === 'string' ? value : formatAmount(value)
//                   )}
//                 </TableCell>
//                 <TableCell className={className} align="right">
//                   {['YES', 'NO'].includes(value2) ? (
//                     <IconYesNo value={value2} />
//                   ) : (
//                     typeof value2 === 'string' ? value2 : formatAmount(value2)
//                   )}
//                 </TableCell>
//               </TableRow>
//             ))}
//             <TableRow>
//               <TableCell className="bg-green-500 text-white-500 text-center font-bold" colSpan={3}>
//                 Input
//               </TableCell>
//             </TableRow>
//             {rows.map(({ name, colSpan = 1, className, value = '' }) => {
//               return (
//                 <TableRow
//                   key={name}
//                   sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
//                 >
//                   <TableCell className={className} component="th" scope="row" colSpan={colSpan}>
//                     {name}
//                   </TableCell>
//                   {(!!value || value === 0) && (
//                     <TableCell align="right">
//                       {typeof value === 'string' ? value : formatAmount(value)}
//                     </TableCell>
//                   )}
//                 </TableRow>
//               )
//             })}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   )
// }

// export default Summary




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



'use client'
import { Box } from '@mui/material'
import React from 'react'

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import GetAppIcon from '@mui/icons-material/GetApp';
import Button from './Button';
import { pv, pmt } from 'financial'
import HomeButton from '../../../HomeButton';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import CancelIcon from '@mui/icons-material/Cancel';

const doc = new jsPDF()

const formatAmount = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const IconYesNo = ({ value }: { value: string }) => {

  // if (value === 'YES') {
  //   return <CheckCircleIcon className="text-green-500 float-right" />
  // }

  // if (value === 'NO') {
  //   return <CancelIcon className="text-red-500 float-right" />
  // }

  return value
}

const Summary = ({ data }: { data: Record<any, any> }) => {
  const monthlyGrossIncomeValue2 = data.monthlyGrossIncome + (data.rentRevenueAdjustmentPercentage / 100) * data.rentSum;
  const singleMortageRatio = (data.PITI / data.monthlyGrossIncome) * 100;
  const doubleMortageRatio = (data.PITI / monthlyGrossIncomeValue2) * 100;
  const maxAvaliableForOtherDebtPayment = data.backendDebtToIncomeRatioPercentage - singleMortageRatio;
  const doubleMaxAvailableForOtherDebtPayment = data.backendDebtToIncomeRatioPercentage - doubleMortageRatio;
  const singleBackendDeptToIcomeRatioAllDepts = ((data.totalMonthlyDebtPayments + data.PITI) * 100) / data.monthlyGrossIncome;
  const doubleBackendDeptToIcomeRatioAllDepts = ((data.totalMonthlyDebtPayments + data.PITI) * 100) / monthlyGrossIncomeValue2;
  const singleMaximumMonthlyMortageAmount = (data.backendDebtToIncomeRatioPercentage / 100) * data.monthlyGrossIncome - data.totalMonthlyDebtPayments;
  const doubleMaximumMonthlyMortageAmount = (data.backendDebtToIncomeRatioPercentage / 100) * monthlyGrossIncomeValue2 - data.totalMonthlyDebtPayments;
  const singleMaximumMortageAmount = -pv((data.interestRate / 100) / 12, data.numberOfPayments, singleMaximumMonthlyMortageAmount);
  const doubleMaximumMortageAmount = -pv((data.interestRate / 100) / 12, data.numberOfPayments, doubleMaximumMonthlyMortageAmount);
  const singleDownPayment035 = (singleMaximumMortageAmount / (1 - data.downPaymentPercentage / 100)) - singleMaximumMortageAmount;
  const doubleDownPayment035 = (doubleMaximumMortageAmount / (1 - data.downPaymentPercentage / 100)) - doubleMaximumMortageAmount;
  const singleMaxHomeValueYouCanBePreApprovedFor = singleMaximumMortageAmount + singleDownPayment035;
  const doubleMaxHomeValueYouCanBePreApprovedFor = doubleMaximumMortageAmount + doubleDownPayment035;
  const singleMortageForThisHome = -1 * pmt(data.interestRate / 100 / 12, 360, singleMaxHomeValueYouCanBePreApprovedFor * (1 - data.downPaymentPercentage / 100));
  const doubleMortageForThisHome = -1 * pmt(data.interestRate / 100 / 12, 360, doubleMaxHomeValueYouCanBePreApprovedFor * (1 - data.downPaymentPercentage / 100));
  const singleTotalMonthlyPaymentsForThisHome = singleMortageForThisHome + data.monthlyPaymentWPmi;
  const doubleTotalMonthlyPaymentsForThisHome = doubleMortageForThisHome + data.monthlyPaymentWPmi;
  const singleReservesAfterUpfrontInvestment = data.yourCurrentSavings - singleDownPayment035;
  const doubleReservesAfterUpfrontInvestment = data.yourCurrentSavings - doubleDownPayment035;
  const singleNumberOfReserveMonths = Math.round(singleReservesAfterUpfrontInvestment / singleTotalMonthlyPaymentsForThisHome);
  const doubleNumberOfReserveMonths = Math.round(doubleReservesAfterUpfrontInvestment / doubleTotalMonthlyPaymentsForThisHome);
  const recommendationRows = [
    {
      name: '7. How Much Can I Afford?',
      className: 'bg-grey-400 font-bold',
      value: 'Single Family Home',
      value2: 'MF w/ 75% Rent Rev'
    },
    {
      name: 'Monthly Gross Income',
      value: data.monthlyGrossIncome,
      value2: monthlyGrossIncomeValue2
    },
    {
      name: 'Monthly Debt Obligations (Non-Mortgage)',
      value: data.totalMonthlyDebtPayments,
      value2: data.totalMonthlyDebtPayments
    },
    {
      name: 'Front-End Debt-To-Income Ratio (Mortgage Only)',
      value: `${Number(singleMortageRatio).toFixed(2)}%`,
      value2: `${Number(doubleMortageRatio).toFixed(2)}%`,
    },
    {
      name: '7a. Do You Meet Front-End DTI Criteria?',
      className: 'bg-grey-400 font-bold',
      value: singleMortageRatio < data.frontendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
      value2: doubleMortageRatio < data.frontendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
    },
    {
      name: 'Maximium % Available for Other Debt Payments',
      value: `${Number(maxAvaliableForOtherDebtPayment).toFixed(2)}%`,
      value2: `${Number(doubleMaxAvailableForOtherDebtPayment).toFixed(2)}%`,
    },
    {
      name: 'Maximium $ Available for Other Debt Payment',
      value: (maxAvaliableForOtherDebtPayment / 100) * data.monthlyGrossIncome,
      value2: (doubleMaxAvailableForOtherDebtPayment / 100) * monthlyGrossIncomeValue2,
    },
    {
      name: 'Backend-End Debt-To-Income Ratio (All Debts)',
      value: `${Number(singleBackendDeptToIcomeRatioAllDepts).toFixed(2)}%`,
      value2: `${Number(doubleBackendDeptToIcomeRatioAllDepts).toFixed(2)}%`,
    },
    {
      name: '7b. Do You Meet Backend-End DTI Criteria?',
      className: 'bg-grey-400 font-bold',
      value: singleBackendDeptToIcomeRatioAllDepts < data.backendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
      value2: doubleBackendDeptToIcomeRatioAllDepts < data.backendDebtToIncomeRatioPercentage ? 'YES' : 'NO',
    },
    {
      name: 'Maximium Monthly Mortgage Amount',
      value: singleMaximumMonthlyMortageAmount,
      value2: doubleMaximumMonthlyMortageAmount,
    },
    {
      name: 'Maximum Total Mortgage Amount',
      value: singleMaximumMortageAmount,
      value2: doubleMaximumMortageAmount,
    },
    {
      name: '0.035 Downpayment',
      value: singleDownPayment035,
      value2: doubleDownPayment035,
    },
    {
      name: 'Max Home Value You Can Be Pre-Approved For',
      value: singleMaxHomeValueYouCanBePreApprovedFor,
      value2: doubleMaxHomeValueYouCanBePreApprovedFor,
    },
    {
      name: 'Mortgage For This Home',
      value: singleMortageForThisHome,
      value2: doubleMortageForThisHome,
    },
    {
      name: 'Additional Monthly Payments For This Home',
      value: data.monthlyPaymentWPmi,
      value2: data.monthlyPaymentWPmi,
    },
    {
      name: 'Total Monthly Payments For This Home',
      value: singleTotalMonthlyPaymentsForThisHome,
      value2: doubleTotalMonthlyPaymentsForThisHome,
    },
    {
      name: 'Current Savings',
      value: data.yourCurrentSavings,
      value2: data.yourCurrentSavings,
    },
    {
      name: '7c. Can You Make This Downpayment?',
      className: 'bg-grey-400 font-bold',
      value: singleDownPayment035 < data.yourCurrentSavings ? 'YES' : 'NO',
      value2: doubleDownPayment035 < data.yourCurrentSavings ? 'YES' : 'NO',
    },
    {
      name: 'Reserves after Upfront Investment',
      value: singleReservesAfterUpfrontInvestment,
      value2: doubleReservesAfterUpfrontInvestment,
    },
    {
      name: '6 Months Reserves Would Be...',
      value: data.reserveRequirement * singleTotalMonthlyPaymentsForThisHome,
      value2: data.reserveRequirement * doubleTotalMonthlyPaymentsForThisHome,
    },
    {
      name: '# of Reserve Months',
      value: singleNumberOfReserveMonths,
      value2: doubleNumberOfReserveMonths
    },
    {
      name: '7d. Do You Have 6 Months Reserves?',
      className: 'bg-grey-400 font-bold',
      value: singleNumberOfReserveMonths > 6 ? 'YES' : 'NO',
      value2: doubleNumberOfReserveMonths > 6 ? 'YES' : 'NO',
    },
  ]

  const rows = [
    { name: '1. Loan Terms', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'Home Price', value: data.homePrice, colSpan: 2 },
    { name: 'Downpayment (%)', value: `${data.downPaymentPercentage}%`, colSpan: 2 },
    { name: 'Downpayment ($)', value: data.downPaymentAmount, colSpan: 2 },
    { name: 'Mortgage', value: data.mortgage, colSpan: 2 },
    { name: 'Interest Rate (per year)', value: `${data.interestRate}%`, colSpan: 2 },
    { name: 'Terms (Years)', value: `${data.terms}`, colSpan: 2 },
    { name: '# of Payments', value: `${data.numberOfPayments}`, colSpan: 2 },
    { name: 'Mortgage Payment (Principal & Interest)', value: data.mortgagePayment, colSpan: 2 },
    { name: '2. Rent Revenues', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'Unit #1 Rent or Live In', value: data.rentLive, colSpan: 2 },
    { name: 'Unit #2 Rent', value: data.rent2, colSpan: 2 },
    { name: 'Unit #3 Rent', value: data.rent3, colSpan: 2 },
    { name: 'Unit #4 Rent', value: data.rent4, colSpan: 2 },
    { name: 'Other Revenue (w+d, prkg)', value: data.otherRevenue, colSpan: 2 },
    { name: 'Rent Revenues sum', value: data.rentSum, colSpan: 2},
    { name: '2a. Financing Expense', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'Escrow: Taxes', value: data.escrowTaxes, colSpan: 2},
    { name: `Escrow: Homeowner's Insurance`, value: data.escrowHomeownersInsurance, colSpan: 2},
    { name: 'Escrow: Hazard Insurance', value: data.escrowHazardInsurance, colSpan: 2},
    { name: 'Monthly Payment w/o PMI', value: data.monthlyPaymentWoPMI, colSpan: 2},
    { name: '3b. PMI', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'PMI Expense (%)', value: `${data.pmiExpensePercentage}%`, colSpan: 2},
    { name: 'PMI Expense ($)', value: data.pmiExpenseAmount, colSpan: 2},
    { name: 'Monthly Payment w/PMI', value: data.monthlyPaymentWPmi, colSpan: 2},
    { name: 'P.I.T.I. Principal Interest Taxes Insurance', value: data.PITI, colSpan: 2},
    { name: '4. Debt-To-Income Ratios & Reserve Requirements', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'Front-End Debt-To-Income Ratio by Banks', value: `${data.frontendDebtToIncomeRatioPercentage}%`, colSpan: 2},
    { name: 'Back-End Debt-To-Income Ratio by Banks', value: `${data.backendDebtToIncomeRatioPercentage}%`, colSpan: 2},
    { name: 'Reserve Requirement (Months)', value: data.reserveRequirement, colSpan: 2},
    { name: 'Rent Revenue Adjustment By Banks', value: `${data.rentRevenueAdjustmentPercentage}%`, colSpan: 2},
    { name: 'Additional Income For Affordability Calculation', value: data.additionalIncomeForAffordabilityCalculation, colSpan: 2},
    { name: '5. Your Financial Situation', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'Your Current Rent', value: data.yourCurrentRent, colSpan: 2},
    { name: 'Your Current Annual Salary / Gross Income', value: data.yourCurrentAnnualSalary, colSpan: 2},
    { name: 'Monthly Gross Income', value: data.monthlyGrossIncome, colSpan: 2},
    { name: 'Your Current Savings', value: data.yourCurrentSavings, colSpan: 2},
    { name: '6. Monthly Debt Payments', colSpan: 3, className: 'bg-grey-400 font-bold'},
    { name: 'First Home Monthly Mortgage Payment', value: data.firstHomeMonthlyMortgagePayment, colSpan: 2},
    { name: 'Student Loans Monthly Payment', value: data.studentLoansMonthlyPayment, colSpan: 2},
    { name: 'Car Note Monthly Payment', value: data.carNoteMonthlyPayment, colSpan: 2},
    { name: 'Credit Card Payments', value: data.creditCardPayments, colSpan: 2},
    { name: 'Other Debt Monthly Payment', value: data.otherDebtMonthlyPayment, colSpan: 2},
    { name: 'Monthly dept payments sum', value: data.totalMonthlyDebtPayments, colSpan: 2},
  ]

  return (
    <Box className="w-[800px] max-w-full mx-auto overflow-auto">
      <Box className="flex justify-end mb-2">
        <HomeButton />
        <Button
          startIcon={<GetAppIcon />}
          onClick={() => {
            autoTable(doc, { html: '#my-table', useCss: true})
            doc.save('table.pdf')
          }}
        >
          Export pdf
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table id="my-table" sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell className="bg-green-500 text-white-500 text-center font-bold" colSpan={3}>Recommendation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recommendationRows.map(({ name, className, value = '', value2 = '' }, index) => (
              <TableRow key={index}>
                <TableCell className={className} component="th" scope="row">
                  {name}
                </TableCell>
                <TableCell className={className} align="right">
                  {['YES', 'NO'].includes(value) ? (
                    <IconYesNo value={value} />
                  ) : (
                    typeof value === 'string' ? value : formatAmount(value)
                  )}
                </TableCell>
                <TableCell className={className} align="right">
                  {['YES', 'NO'].includes(value2) ? (
                    <IconYesNo value={value2} />
                  ) : (
                    typeof value2 === 'string' ? value2 : formatAmount(value2)
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="bg-green-500 text-white-500 text-center font-bold" colSpan={3}>
                Input
              </TableCell>
            </TableRow>
            {rows.map(({ name, colSpan = 1, className, value = '' }) => {
              return (
                <TableRow
                  key={name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell className={className} component="th" scope="row" colSpan={colSpan}>
                    {name}
                  </TableCell>
                  {(!!value || value === 0) && (
                    <TableCell align="right">
                      {typeof value === 'string' ? value : formatAmount(value)}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default Summary


