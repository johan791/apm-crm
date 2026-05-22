"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createPartner(formData: FormData) {
  const partner = await prisma.partner.create({
    data: {
      companyName: formData.get("companyName") as string,
      contactPerson: (formData.get("contactPerson") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      category: formData.get("category") as string,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/partners");
  revalidatePath("/");
  redirect(`/partners/${partner.id}`);
}

export async function updatePartner(id: string, formData: FormData) {
  await prisma.partner.update({
    where: { id },
    data: {
      companyName: formData.get("companyName") as string,
      contactPerson: (formData.get("contactPerson") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      category: formData.get("category") as string,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/partners");
  revalidatePath(`/partners/${id}`);
  revalidatePath("/");
  redirect(`/partners/${id}`);
}

export async function deletePartner(id: string) {
  await prisma.partner.delete({ where: { id } });
  revalidatePath("/partners");
  revalidatePath("/");
  redirect("/partners");
}
