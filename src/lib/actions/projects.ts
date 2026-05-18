"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const hourlyRate = formData.get("hourlyRate") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  const project = await prisma.project.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "active",
      customerId: formData.get("customerId") as string,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/projekt");
  revalidatePath("/");
  redirect(`/projekt/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const hourlyRate = formData.get("hourlyRate") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  await prisma.project.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "active",
      customerId: formData.get("customerId") as string,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/projekt");
  revalidatePath(`/projekt/${id}`);
  revalidatePath("/");
  redirect(`/projekt/${id}`);
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projekt");
  revalidatePath("/");
  redirect("/projekt");
}

export async function updateProjectStatus(id: string, status: string) {
  await prisma.project.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/projekt");
  revalidatePath(`/projekt/${id}`);
  revalidatePath("/");
}
