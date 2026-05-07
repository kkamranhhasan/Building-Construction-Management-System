import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// =====================================
// COMPANY INFO
// =====================================
export const getCompanyInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    let info = await prisma.companyInfo.findFirst();
    if (!info) {
      info = await prisma.companyInfo.create({ data: {} });
    }
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCompanyInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, heroTitle, heroSub, aboutText, mission, vision, phone, email, address } = req.body;
    let info = await prisma.companyInfo.findFirst();
    
    if (info) {
      info = await prisma.companyInfo.update({
        where: { id: info.id },
        data: { name, heroTitle, heroSub, aboutText, mission, vision, phone, email, address }
      });
    } else {
      info = await prisma.companyInfo.create({
        data: { name, heroTitle, heroSub, aboutText, mission, vision, phone, email, address }
      });
    }
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================
// PROJECTS
// =====================================
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, imageUrl, status } = req.body;
    const project = await prisma.project.create({
      data: { title, description, imageUrl, status: status || 'RUNNING' }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Missing project id' });
      return;
    }
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================
// CONTACT MESSAGES
// =====================================
export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message } = req.body;
    const contact = await prisma.contactMessage.create({
      data: { name, email, message }
    });
    res.status(201).json({ message: 'Message sent successfully', contact });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markContactRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Missing message id' });
      return;
    }
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
