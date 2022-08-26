import { prisma } from "./prisma.server";

export async function createProject(projectData: any) {
  return await prisma.project.create({
    data: projectData,
  });
}