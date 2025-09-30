"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil1Icon } from "@radix-ui/react-icons";

type EditProfileModalProps = {
  name: string;
  gmail: string;
  role: string;
};

// Zod schema
const editProfileSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    gmail: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormData = z.infer<typeof editProfileSchema>;

export default function EditProfileModal({ name, gmail, role }: EditProfileModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name,
      gmail,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    reset({
      name,
      gmail,
      password: "",
      confirmPassword: "",
    });
  }, [name, gmail, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, email: gmail }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Error al actualizar perfil");
        return;
      }

      alert("Perfil actualizado correctamente!");
      setOpen(false); // cerrar modal
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="cursor-pointer flex items-center p-1 rounded hover:scale-105 transition-transform">
          <Pencil1Icon className="w-4 h-4 text-red-500 mr-1" /> Edit profile
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <div className="col-span-3">
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
          </div>

          {/* Gmail */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gmail" className="text-right">Gmail</Label>
            <div className="col-span-3">
              <Input id="gmail" {...register("gmail")} />
              {errors.gmail && <p className="text-red-500 text-sm mt-1">{errors.gmail.message}</p>}
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <div className="col-span-3">
              <Input
                id="password"
                type="password"
                placeholder="Dejar vacío para no cambiar"
                {...register("password")}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">Confirm</Label>
            <div className="col-span-3">
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Role (solo lectura) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Input
              id="role"
              value={role}
              disabled
              className="col-span-3 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="mt-2 w-full">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
