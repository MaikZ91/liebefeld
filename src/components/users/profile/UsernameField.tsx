
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';

interface UsernameFieldProps {
  form: UseFormReturn<z.infer<any>>;
}

const UsernameField: React.FC<UsernameFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-300">Benutzername</FormLabel>
          <FormControl>
            <Input
              placeholder="Dein öffentlicher Name"
              {...field}
              className="bg-gray-900/50 border-gray-700 focus:ring-red-500 focus:border-red-500 text-base"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default UsernameField;
