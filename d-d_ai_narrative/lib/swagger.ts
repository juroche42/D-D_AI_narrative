import swaggerJSDoc from "swagger-jsdoc"

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Next API",
            version: "1.0.0",
        },
    },
    apis: ["./app/api/**/*.ts"],
})
