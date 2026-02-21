import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/test-db:
 *   get:
 *     summary: Teste la connexion à la base de données
 *     description: Vérifie la connexion PostgreSQL et retourne la liste des users (sans le mot de passe)
 *     tags:
 *       - Database
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Connexion PostgreSQL réussie
 *                 userCount:
 *                   type: number
 *                   example: 3
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       500:
 *         description: Erreur de connexion
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      status: "ok",
      message: "Connexion PostgreSQL réussie ✅",
      userCount: users.length,
      users,
    });
  } catch (error) {
    console.error("[test-db] Erreur de connexion :", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Impossible de se connecter à la base de données ❌",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

