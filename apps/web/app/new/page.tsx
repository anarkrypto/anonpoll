"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, PlusIcon, TrashIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const pollFormSchema = z.object({
  title: z.string().trim().min(3).max(128),
  description: z.string().trim().max(1024).nullable(),
  options: z.array(z.string().trim().min(1).max(128)),
});

type PollFormData = z.infer<typeof pollFormSchema>;

export default function PollForm() {
  const form = useForm<PollFormData>({
    defaultValues: {
      title: "",
      description: "",
      options: [],
    },
    resolver: zodResolver(pollFormSchema),
  });

  const handleSubmit = (data: PollFormData) => {
    console.log({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      options: data.options.map((opt) => opt.trim()),
    });
  };

  return (
    <Card className="mx-auto max-w-2xl rounded-lg bg-white shadow-md lg:p-6">
      <CardHeader>
        <CardTitle className="text-center text-3xl text-secondary">
          Create a New Poll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Poll Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter poll title"
                      required
                      {...field}
                      invalid={fieldState.invalid}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter poll description"
                      required
                      invalid={fieldState.invalid}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Options</FormLabel>
                  <FormControl>
                    <OptionsInputsGroup {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" color="secondary">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function OptionsInputsGroup({
  value = [],
  onChange,
  maxOptions = Infinity,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  maxOptions?: number;
}) {
  // Fill the array with 2 default options
  const options = [
    value[0] ?? "Option 1",
    value[1] ?? "Option 2",
    ...value.slice(2),
  ];

  const addOption = () => {
    onChange([...options, `Option ${options.length}`]);
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  return (
    <>
      {options.map((option, index) => (
        <div className="mb-2">
          <div key={index} className="flex items-center">
            <Input
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
              className="mr-2"
              invalid={option.length === 0}
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeOption(index)}
                className="flex-shrink-0"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
          {option.length === 0 && (
            <p className="text-red-500">Option cannot be empty.</p>
          )}
        </div>
      ))}

      {maxOptions > options.length ? (
        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          className="mt-2"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Add Option
        </Button>
      ) : (
        <p className="mr-2 mt-2 text-sm text-red-500">
          Maximum {maxOptions} options reached.
        </p>
      )}
    </>
  );
}
