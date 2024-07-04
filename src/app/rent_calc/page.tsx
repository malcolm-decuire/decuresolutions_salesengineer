// 'use client'
// import { Button} from "@/components/Button";
// import Input from "@/components/Input";
// import { Box, Typography } from "@mui/material";
// import { useState } from "react";
// import { Controller, useForm } from "react-hook-form";
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
// import Slider from "@/components/Slider";
// import dynamic from 'next/dynamic';

// const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });


// interface IFormValues {
//   location: string;
//   monthlyGrossIncome: number;
//   monthlyDebts: number;
//   monthlySavings: number;
//   monthlyExpenses: number;
//   rent: number;
// }

// const marks = [
//   {
//     value: 20,
//     label: '20%',
//   },
//   {
//     value: 40,
//     label: '40%',
//   },
// ];

// const Home = () => {
//   const [showAll, setShowAll] = useState<boolean>(false);
//   const {
//     control,
//     handleSubmit,
//     watch
//   } = useForm<IFormValues>({
//     defaultValues: {
//       location: 'Los Angeles, CA',
//       monthlyGrossIncome: 5000,
//       monthlyDebts: 2000,
//       monthlySavings: 500,
//       monthlyExpenses: 100,
//       rent: 30
//     },
//     mode: 'onTouched',
//   });

//   const onSubmit = (value: IFormValues) => {
//     console.log(value);
//   };


//   const values = watch();
//   const rentAmount = values.monthlyGrossIncome * (values.rent / 100);
//   const amountLeft = values.monthlyGrossIncome - values.monthlyDebts - values.monthlySavings - values.monthlyExpenses - values.monthlyGrossIncome * 0.3;
//   const amountLeftPercent = amountLeft / values.monthlyGrossIncome;
//   const renderRentAmount = rentAmount.toFixed(2);

//   const data = [
//     {
//       name: 'Amount left',
//       y: amountLeftPercent
//     },
//     {
//       name: 'Monthly Savings',
//       y: values.monthlySavings / values.monthlyGrossIncome,
//     },
//     {
//       name: 'Monthly Expenses',
//       y: values.monthlyExpenses / values.monthlyGrossIncome,
//     },
//     {
//       name: 'Monthly Debts',
//       y: values.monthlyDebts / values.monthlyGrossIncome,
//     },
//     {
//       name: 'Rent',
//       y: (rentAmount) / values.monthlyGrossIncome,
//     },
//   ];

//   return (
//     <Box className="flex flex-col md:flex-row max-w-[860px] w-full mx-auto rounded-[25px] overflow-hidden">
//       <Box className="w-full md:w-2/3 p-7 pt-50 flex flex-col gap-8">
//         <Typography className="text-center font-medium" variant="h2">How much rent can I afford?</Typography>
//         {/* <Controller
//           control={control}
//           rules={{
//             required: 'Must be completed',
//           }}
//           render={({ field, fieldState: { error } }) => (
//             <Input {...field} placeholder="Location" error={error} autoFocus={true} />
//           )}
//           name="location"
//         /> */}
//         <Box className="flex flex-col md:flex-row items-center justify-between gap-8">
//           <Controller
//             control={control}
//             rules={{
//               required: 'Must be completed',
//             }}
//             render={({ field, fieldState: { error } }) => (
//               <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly Gross Income" error={error} />
//             )}
//             name="monthlyGrossIncome"
//           />
//           <Controller
//             control={control}
//             rules={{
//               required: 'Must be completed',
//             }}
//             render={({ field, fieldState: { error } }) => (
//               <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly debts" error={error} />
//             )}
//             name="monthlyDebts"
//           />
//         </Box>
//         {showAll && (
//           <Box className="flex flex-col md:flex-row items-center justify-between gap-8">
//             <Controller
//               control={control}
//               render={({ field, fieldState: { error } }) => (
//                 <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly Savings" error={error} />
//               )}
//               name="monthlySavings"
//             />
//             <Controller
//               control={control}
//               render={({ field, fieldState: { error } }) => (
//                 <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly Expenses" error={error} />
//               )}
//               name="monthlyExpenses"
//             />
//           </Box>
//         )}
//         <Box className="flex w-full justify-center md:justify-end -mb-8">
//           <Button
//             onClick={() => setShowAll(!showAll)}
//             className="bg-grey-400 max-w-[160px] !text-black-500"
//             endIcon={
//               <KeyboardArrowDownIcon
//                 className={`w-7 ${showAll ? 'transform rotate-180' : ''}`}
//               />
//             }
//           >More Options</Button>
//         </Box>
//         <Button onClick={handleSubmit(onSubmit)} className="max-w-[160px] mx-auto mt-8 md:mt-0">Calculate Rent</Button>
//         <Typography className="text-center text-black text-sm" variant="body1">
//           You can afford a ${renderRentAmount} rent in the US while spending {values.rent}% of your monthly income.
//         </Typography>
//         <Typography className="text-center text-black text-sm" variant="body1">
//           You will have ${amountLeft.toFixed(2)} left to spend per month.
//         </Typography>
//         <Controller
//           control={control}
//           render={({ field }) => (
//             <Slider
//               onChange={(...args) => {
//                 field.onChange(...args);
//                 field.onBlur();
//               }}
//               value={field.value}
//               shiftStep={30}
//               step={5}
//               min={20}
//               max={40}
//               marks={marks}
//             />
//           )}
//           name="rent"
//         />
 
//       </Box>
//       <Box className="w-full md:w-1/3 items-start justify-center flex bg-gradient-to-r from-blue-100 to-blue-200">
//         <Box className="w-[240px]">
//           <Chart  
//             data={data}
//           />
//           <Typography className="p-[20px] text-center text-2xl" variant="body1">
//             You can afford ${amountLeft < 0 ? '0' : renderRentAmount}/<span className="text-sm">month.</span>
//           </Typography>
//         </Box>
//       </Box>
//     </Box>
//   );
// }

// export default Home;


///////////////////

'use client'
import { Button} from "@/components/Button";
import Input from "@/components/Input";
import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Slider from "@/app/investment_calc/components/Slider";
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });


interface IFormValues {
  location: string;
  monthlyGrossIncome: number;
  monthlyDebts: number;
  monthlySavings: number;
  monthlyExpenses: number;
  rent: number;
}

const marks = [
  {
    value: 20,
    label: '20%',
  },
  {
    value: 40,
    label: '40%',
  },
];

const Home = () => {
  const [showAll, setShowAll] = useState<boolean>(false);
  const {
    control,
    handleSubmit,
    watch
  } = useForm<IFormValues>({
    defaultValues: {
      location: 'Los Angeles, CA',
      monthlyGrossIncome: 5000,
      monthlyDebts: 2000,
      monthlySavings: 500,
      monthlyExpenses: 100,
      rent: 30
    },
    mode: 'onTouched',
  });

  const onSubmit = (value: IFormValues) => {
    console.log(value);
  };


  const values = watch();
  const rentAmount = values.monthlyGrossIncome * (values.rent / 100);
  const amountLeft = values.monthlyGrossIncome - values.monthlyDebts - values.monthlySavings - values.monthlyExpenses - values.monthlyGrossIncome * 0.3;
  const amountLeftPercent = amountLeft / values.monthlyGrossIncome;
  const renderRentAmount = rentAmount.toFixed(2);

  const data = [
    {
      name: 'Amount left',
      y: amountLeftPercent
    },
    {
      name: 'Monthly Savings',
      y: values.monthlySavings / values.monthlyGrossIncome,
    },
    {
      name: 'Monthly Expenses',
      y: values.monthlyExpenses / values.monthlyGrossIncome,
    },
    {
      name: 'Monthly Debts',
      y: values.monthlyDebts / values.monthlyGrossIncome,
    },
    {
      name: 'Rent',
      y: (rentAmount) / values.monthlyGrossIncome,
    },
  ];
  return (
    <Box className="flex flex-col md:flex-row max-w-[860px] w-full mx-auto rounded-[25px] overflow-hidden">
      <Box className="w-full md:w-2/3 p-7 pt-50 flex flex-col gap-8">
        <Typography className="text-center font-medium" variant="h2">How much can I afford?</Typography>
        {/* <Controller
          control={control}
          rules={{
            required: 'Must be completed',
          }}
          render={({ field, fieldState: { error } }) => (
            <Input {...field} placeholder="Location" error={error} autoFocus={true} />
          )}
          name="location"
        /> */}
        <Box className="flex flex-col md:flex-row items-center justify-between gap-8">
          <Controller
            control={control}
            rules={{
              required: 'Must be completed',
            }}
            render={({ field, fieldState: { error } }) => (
              <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly Gross Income" error={error} />
            )}
            name="monthlyGrossIncome"
          />
          <Controller
            control={control}
            rules={{
              required: 'Must be completed',
            }}
            render={({ field, fieldState: { error } }) => (
              <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly debts" error={error} />
            )}
            name="monthlyDebts"
          />
        </Box>
        {showAll && (
          <Box className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Controller
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly Savings" error={error} />
              )}
              name="monthlySavings"
            />
            <Controller
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input {...field} type="number" className="w-full md:w-1/2" placeholder="Monthly Expenses" error={error} />
              )}
              name="monthlyExpenses"
            />
          </Box>
        )}
        <Box className="flex w-full justify-center md:justify-end gap-4 mt-4">
          <Button
            onClick={() => setShowAll(!showAll)}
            className="bg-grey-400 max-w-[160px] !text-black-500"
            endIcon={
              <KeyboardArrowDownIcon
                className={`w-7 ${showAll ? 'transform rotate-180' : ''}`}
              />
            }
          >More Options</Button>
          <Button onClick={handleSubmit(onSubmit)} className="max-w-[160px]">Calculate Rent</Button>
        </Box>
        <Typography className="text-center text-black text-sm" variant="body1">
          You can afford a ${renderRentAmount} rent in the US while spending {values.rent}% of your monthly income.
        </Typography>
        <Typography className="text-center text-black text-sm" variant="body1">
          You will have ${amountLeft.toFixed(2)} left to spend per month.
        </Typography>
        <Controller
          control={control}
          render={({ field }) => (
            <Slider
              onChange={(...args) => {
                field.onChange(...args);
                field.onBlur();
              }}
              value={field.value}
              shiftStep={30}
              step={5}
              min={20}
              max={40}
              marks={marks}
            />
          )}
          name="rent"
        />
      </Box>
      <Box className="w-full md:w-1/3 items-start justify-center flex bg-gradient-to-r from-blue-100 to-blue-200">
        <Box className="w-[240px]">
          <Chart data={data} />
          <Typography className="p-[20px] text-center text-2xl" variant="body1">
            You can afford ${amountLeft < 0 ? '0' : renderRentAmount}/<span className="text-sm">month.</span>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
  }
  
  export default Home;
  