"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const customer = await prisma.customer.create({
    data: {
      companyName: formData.get("companyName") as string,
      orgNumber: (formData.get("orgNumber") as string) || null,
      customerNumber: (formData.get("customerNumber") as string) || null,
      contactPerson: (formData.get("contactPerson") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      zipCode: (formData.get("zipCode") as string) || null,
      onedriveFolderUrl: (formData.get("onedriveFolderUrl") as string) || null,
      notes: (formData.get("notes") as string) || null,
      responsibleUserId: (formData.get("responsibleUserId") as string) || null,
    },
  });

  revalidatePath("/kunder");
  revalidatePath("/");
  redirect(`/kunder/${customer.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  await prisma.customer.update({
    where: { id },
    data: {
      companyName: formData.get("companyName") as string,
      orgNumber: (formData.get("orgNumber") as string) || null,
      customerNumber: (formData.get("customerNumber") as string) || null,
      contactPerson: (formData.get("contactPerson") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      zipCode: (formData.get("zipCode") as string) || null,
      onedriveFolderUrl: (formData.get("onedriveFolderUrl") as string) || null,
      notes: (formData.get("notes") as string) || null,
      responsibleUserId: (formData.get("responsibleUserId") as string) || null,
    },
  });

  revalidatePath("/kunder");
  revalidatePath(`/kunder/${id}`);
  revalidatePath("/");
  redirect(`/kunder/${id}`);
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/kunder");
  revalidatePath("/");
  redirect("/kunder");
}
