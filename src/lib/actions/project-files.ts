"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProjectFile(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const category = (formData.get("category") as string) || "ovrigt";

  await prisma.projectFile.create({
    data: { name, url, category, projectId },
  });

  revalidatePath(`/projekt/${projectId}`);
}

export async function deleteProjectFile(id: string, projectId: string) {
  await prisma.projectFile.delete({ where: { id } });
  revalidatePath(`/projekt/${projectId}`);
}
