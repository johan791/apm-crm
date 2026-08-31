"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/current-user";

/**
 * Övriga kontaktpersoner från kryssrutorna. Huvudkontakten filtreras bort så
 * att samma person inte hamnar både som huvudkontakt och som extra.
 */
function extraContactIdsFrom(formData: FormData, primaryId: string | null) {
  return [...new Set(formData.getAll("extraContactIds") as string[])].filter(
    (id) => id && id !== primaryId
  );
}

export async function createProject(formData: FormData) {
  await requireAuth();
  const hourlyRate = formData.get("hourlyRate") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  const contactId = (formData.get("contactId") as string) || null;

  const project = await prisma.project.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "active",
      customerId: formData.get("customerId") as string,
      contactId,
      responsibleUserId: (formData.get("responsibleUserId") as string) || null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      onedriveFolderUrl: (formData.get("onedriveFolderUrl") as string) || null,
      extraContacts: {
        create: extraContactIdsFrom(formData, contactId).map((id) => ({
          contactId: id,
        })),
      },
    },
  });

  revalidatePath("/projekt");
  revalidatePath("/");
  redirect(`/projekt/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  await requireAuth();
  const hourlyRate = formData.get("hourlyRate") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  const contactId = (formData.get("contactId") as string) || null;

  await prisma.project.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "active",
      customerId: formData.get("customerId") as string,
      contactId,
      responsibleUserId: (formData.get("responsibleUserId") as string) || null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      onedriveFolderUrl: (formData.get("onedriveFolderUrl") as string) || null,
      // Kryssrutorna är hela sanningen om vilka extrakontakter som gäller —
      // rensa och lägg tillbaka i stället för att räkna ut skillnaden.
      extraContacts: {
        deleteMany: {},
        create: extraContactIdsFrom(formData, contactId).map((cid) => ({
          contactId: cid,
        })),
      },
    },
  });

  revalidatePath("/projekt");
  revalidatePath(`/projekt/${id}`);
  revalidatePath("/");
  redirect(`/projekt/${id}`);
}

export async function deleteProject(id: string) {
  await requireAuth();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projekt");
  revalidatePath("/");
  redirect("/projekt");
}

export async function updateProjectStatus(id: string, status: string) {
  await requireAuth();
  await prisma.project.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/projekt");
  revalidatePath(`/projekt/${id}`);
  revalidatePath("/");
}
