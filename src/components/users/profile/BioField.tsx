
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { Textarea } from '@/components/ui/textarea';

interface BioFieldProps {
  form: UseFormReturn<z.infer<any>>;
}

const BioField: React.FC<BioFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="bio"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-300">Über mich</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Erzähle der Community etwas über dich..."
              {...field}
              className="bg-gray-900/50 border-gray-700 focus:ring-red-500 focus:border-red-500 text-base min-h-[100px] resize-none"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BioField;
