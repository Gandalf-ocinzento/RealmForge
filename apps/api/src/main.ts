import "reflect-metadata";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { GameGateway } from "./game.gateway";
import { WorldRepository } from "./world.repository";

@Controller("health")
class HealthController {
  @Get()
  check() { return { status: "ok", service: "realmforge-api" }; }
}

@Module({
  controllers: [HealthController],
  providers: [WorldRepository, GameGateway],
})
class AppModule {}

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
  console.log("RealmForge API em http://localhost:" + port);
}
main().catch(err => { console.error(err); process.exitCode = 1; });
