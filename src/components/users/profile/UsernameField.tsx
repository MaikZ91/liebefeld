
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
          <FormLabel>Benutzername</FormLabel>
          <FormControl>
            <Input
              placeholder="Benutzername eingeben"
              {...field}
              className="bg-gray-900 border-gray-700"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default UsernameField;
