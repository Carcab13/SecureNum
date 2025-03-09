import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { insertNumberSchema, type InsertNumber } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function NumberForm() {
  const { toast } = useToast();
  const form = useForm<InsertNumber>({
    resolver: zodResolver(insertNumberSchema),
    defaultValues: { value: 0 },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertNumber) => {
      const res = await apiRequest("POST", "/api/numbers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/numbers"] });
      form.reset();
      toast({
        title: "Success",
        description: "Number added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Add New Number</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex gap-4">
            <Input
              type="number"
              {...form.register("value", { valueAsNumber: true })}
              placeholder="Enter a number"
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Number"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
