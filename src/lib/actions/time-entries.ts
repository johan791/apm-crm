"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/current-user";

export async function createTimeEntry(formData: FormData) {
  await requireAuth();
  const projectId = formData.get("projectId") as string;
  const returnTo = (formData.get("returnTo") as string) || null;

  await prisma.timeEntry.create({
    data: {
      projectId,
      date: new Date(formData.get("date") as string),
      hours: parseFloat(formData.get("hours") as string),
      description: (formData.get("description") as string) || null,
    },
  });

  revalidatePath("/tidrapportering");
  revalidatePath(`/projekt/${projectId}/tid`);
  revalidatePath(`/projekt/${projectId}`);
  revalidatePath("/");
  redirect(returnTo || `/projekt/${projectId}/tid`);
}

export async function updateTimeEntry(id: string, formData: FormData) {
  await requireAuth();
  const projectId = formData.get("projectId") as string;
  const returnTo = (formData.get("returnTo") as string) || null;

  await prisma.timeEntry.update({
    where: { id },
    data: {
      projectId,
      date: new Date(formData.get("date") as string),
      hours: parseFloat(formData.get("hours") as string),
      description: (formData.get("description") as string) || null,
    },
  });

  revalidatePath("/tidrapportering");
  revalidatePath(`/projekt/${projectId}/tid`);
  revalidatePath(`/projekt/${projectId}`);
  revalidatePath("/");
  redirect(returnTo || `/projekt/${projectId}/tid`);
}

export async function deleteTimeEntry(id: string, projectId: string, returnTo?: string) {
  await requireAuth();
  await prisma.timeEntry.delete({ where: { id } });

  revalidatePath("/tidrapportering");
  revalidatePath(`/projekt/${projectId}/tid`);
  revalidatePath(`/projekt/${projectId}`);
  revalidatePath("/");
  redirect(returnTo || `/projekt/${projectId}/tid`);
}
