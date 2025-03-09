import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertNumberSchema } from "@shared/schema";

function generateAIResponse(message: string): string {
  // Basic response generation based on keywords
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("help")) {
    return "I can help you manage your numbers. Try asking about adding, viewing, or deleting numbers.";
  }

  if (lowerMessage.includes("add") || lowerMessage.includes("create")) {
    return "To add a new number, use the form at the top of the page. Enter any number and click 'Add Number'.";
  }

  if (lowerMessage.includes("delete") || lowerMessage.includes("remove")) {
    return "To delete a number, find it in your list and click the trash icon next to it.";
  }

  if (lowerMessage.includes("view") || lowerMessage.includes("see") || lowerMessage.includes("list")) {
    return "Your numbers are displayed in the list below the input form. They're automatically updated when you add or delete numbers.";
  }

  return "I'm here to help you with managing your numbers. What would you like to know?";
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Protected routes middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Chat endpoint
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = generateAIResponse(message);
      res.json({ message: response });
    } catch (err) {
      console.error('Error in chat endpoint:', err);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Number routes
  app.get("/api/numbers", requireAuth, async (req, res) => {
    try {
      const numbers = await storage.getNumbers(req.user!.id);
      res.json(numbers);
    } catch (err) {
      console.error('Error getting numbers:', err);
      res.status(500).json({ message: "Failed to fetch numbers" });
    }
  });

  app.post("/api/numbers", requireAuth, async (req, res) => {
    try {
      const result = insertNumberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid number data" });
      }

      const number = await storage.createNumber({
        ...result.data,
        userId: req.user!.id,
      });
      res.status(201).json(number);
    } catch (err) {
      console.error('Error creating number:', err);
      res.status(500).json({ message: "Failed to create number" });
    }
  });

  app.delete("/api/numbers/:id", requireAuth, async (req, res) => {
    try {
      const numberId = parseInt(req.params.id);
      if (isNaN(numberId)) {
        return res.status(400).json({ message: "Invalid number ID" });
      }

      await storage.deleteNumber(numberId, req.user!.id);
      res.sendStatus(200);
    } catch (err) {
      console.error('Error deleting number:', err);
      res.status(500).json({ message: "Failed to delete number" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}