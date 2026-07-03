"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/current-user";

export async function createDeliveryEvent(formData: FormData) {
  await requireAuth();
  await prisma.deliveryEvent.create({
    data: {
      type: formData.get("type") as string,
      date: new Date(formData.get("date") as string),
      time: (formData.get("time") as string) || null,
      projectId: formData.get("projectId") as string,
      customerId: formData.get("customerId") as string,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/leveransplanering");
  revalidatePath("/");
  redirect("/leveransplanering");
}

export async function updateDeliveryEvent(id: string, formData: FormData) {
  await requireAuth();
  await prisma.deliveryEvent.update({
    where: { id },
    data: {
      type: formData.get("type") as string,
      date: new Date(formData.get("date") as string),
      time: (formData.get("time") as string) || null,
      projectId: formData.get("projectId") as string,
      customerId: formData.get("customerId") as string,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/leveransplanering");
  revalidatePath("/");
  redirect("/leveransplanering");
}

export async function deleteDeliveryEvent(id: string) {
  await requireAuth();
  await prisma.deliveryEvent.delete({ where: { id } });
  revalidatePath("/leveransplanering");
  revalidatePath("/");
  redirect("/leveransplanering");
}
