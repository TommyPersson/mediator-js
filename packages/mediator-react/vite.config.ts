import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    reporters: ["default", "json", "junit"],
    outputFile: {
      junit: "./build/junit-report.xml",
      json: "./build/json-report.json",
    },
  },
})
