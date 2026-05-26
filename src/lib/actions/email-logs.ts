"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";

export async function createEmailLog(formData: FormData) {
  const userId = await currentUserId();
  const subject = formData.get("subject") as string;
  const body = (formData.get("body") as string) || null;
  const counterpart = formData.get("counterpart") as string;
  const direction = (formData.get("direction") as string) || "ut";
  const customerId = (formData.get("customerId") as string) || null;
  const projectId = (formData.get("projectId") as string) || null;
  const sentAtStr = formData.get("sentAt") as string;
  const returnTo = formData.get("returnTo") as string;

  const sentAt = sentAtStr ? new Date(sentAtStr) : new Date();

  await prisma.emailLog.create({
    data: {
      subject,
      body,
      counterpart,
      direction,
      customerId: customerId || undefined,
      projectId: projectId || undefined,
      sentAt,
      createdById: userId,
    },
  });

  if (returnTo) {
    revalidatePath(returnTo);
    redirect(returnTo);
  }

  revalidatePath("/mejl");
  redirect("/mejl");
}

export async function deleteEmailLog(id: string) {
  await prisma.emailLog.delete({ where: { id } });
  revalidatePath("/mejl");
}
