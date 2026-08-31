import express from "express";
import dotenv from "dotenv"
import cors from "cors";
import helmet from "helmet";
import logger from "./shared/config/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import ResponseFormatter from "./shared/utils/responseFormatter.js";
import { initializeConnections, closeConnections } from "./db/init.js";
import cookieParser from "cookie-parser";
import config from "./shared/config/index.js";
import authRouter from "./services/auth/routes/authRouter.js";
import clientRouter from "./services/client/routes/clientRoutes.js";
import ingestRouter from "./services/ingest/routes/ingestRoutes.js";

dotenv.config();
const app = express();

app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        // and reflect any origin back — suitable for development
        callback(null, origin || '*');
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))

app.use(helmet());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    next();
})

app.use('/health', (req, res) => {
    return res.status(200).json(ResponseFormatter.success(
        {
            status: 'healthy',
            uptime: process.uptime(),
        },
        'Health check passed',
        200,
    ))
})


// Routes
app.use('/api/auth', authRouter)
app.use('/api/admin/client', clientRouter)
app.use('/api/hit', ingestRouter)

app.get('/', (req, res) => {
    return res.status(200).json(
        ResponseFormatter.success(
            {
                service: 'API Hit Monitoring System',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    auth: '/api/auth',
                    ingest: '/api/hit',
                    analytics: '/api/analytics',
                },
            },
            'API Hit Monitoring Service'
        )
    )
})

app.use((req, res) => {
    return res.status(404).json(ResponseFormatter.error(
        'Resource not found',
        404,
    ))
})

app.use(errorHandler)

const startServer = async () => {
    try {
        await initializeConnections();

        const server = app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`)
            logger.info(`Environment: ${config.node_env}`)
            logger.info(`Application running at: http://localhost:${config.port}`)
        })

        const handleGracefulShutdown = async (signal) => {

            logger.info(`Received ${signal}, shutting down gracefully...`);

            server.close(async () => {
                logger.info("Server closed");
                await closeConnections()
            })

            setTimeout(() => {
                logger.error('Could not close connections in time, forcing shutdown');
                process.exit(1);
            }, 10000); // 10 second timeout
        }

        process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
        process.on('uncaughtException', error => {
            logger.error('Uncaught exception: ', error);
            handleGracefulShutdown('uncaughtException');
        })

        process.on('unhandledRejection', error => {
            logger.error('Unhandled rejection: ', error);
            handleGracefulShutdown('unhandledRejection');
        })

        return server;
    } catch (error) {
        logger.error("Failed to start server: ", error)
        process.exit(1)
    }
}

// start server
startServer()