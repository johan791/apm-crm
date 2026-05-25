"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createContact(customerId: string, formData: FormData) {
  await prisma.contact.create({
    data: {
      customerId,
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
    },
  });

  revalidatePath(`/kunder/${customerId}`);
}

export async function updateContact(
  id: string,
  customerId: string,
  formData: FormData
) {
  await prisma.contact.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
    },
  });

  revalidatePath(`/kunder/${customerId}`);
}

export async function deleteContact(id: string, customerId: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath(`/kunder/${customerId}`);
}
