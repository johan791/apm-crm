"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId, requireAuth } from "@/lib/current-user";

export async function createActivity(formData: FormData) {
  const userId = await requireUserId();
  const customerId = (formData.get("customerId") as string) || null;
  const projectId = (formData.get("projectId") as string) || null;
  const unlinkedCustomerText =
    (formData.get("unlinkedCustomerText") as string) || null;
  const dueDateStr = formData.get("dueDate") as string;

  await prisma.activity.create({
    data: {
      type: (formData.get("type") as string) || "anteckning",
      title: (formData.get("title") as string) || null,
      description: formData.get("description") as string,
      customerId,
      projectId,
      unlinkedCustomerText: !customerId ? unlinkedCustomerText : null,
      assignedToId: (formData.get("assignedToId") as string) || userId,
      createdById: userId,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
  });

  if (customerId) {
    revalidatePath(`/kunder/${customerId}`);
  }
  if (projectId) {
    revalidatePath(`/projekt/${projectId}`);
  }
  revalidatePath("/aktiviteter");
  revalidatePath("/");
}

export async function updateActivityStatus(id: string, status: string) {
  await requireAuth();
  const activity = await prisma.activity.update({
    where: { id },
    data: { status },
  });

  if (activity.customerId) {
    revalidatePath(`/kunder/${activity.customerId}`);
  }
  if (activity.projectId) {
    revalidatePath(`/projekt/${activity.projectId}`);
  }
  revalidatePath("/aktiviteter");
  revalidatePath("/");
}

export async function deleteActivity(id: string) {
  await requireAuth();
  const activity = await prisma.activity.delete({ where: { id } });

  if (activity.customerId) {
    revalidatePath(`/kunder/${activity.customerId}`);
  }
  if (activity.projectId) {
    revalidatePath(`/projekt/${activity.projectId}`);
  }
  revalidatePath("/aktiviteter");
  revalidatePath("/");
}

export async function createQuickNote(formData: FormData) {
  await createActivity(formData);
  const returnTo = formData.get("returnTo") as string;
  if (returnTo) {
    redirect(returnTo);
  }
}
