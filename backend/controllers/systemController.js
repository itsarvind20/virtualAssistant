import { execFile } from "child_process";

const POWER_ACTIONS = {
    sleep: {
        label: "sleep",
        command: "rundll32.exe",
        args: ["powrprof.dll,SetSuspendState", "0,1,0"]
    },
    restart: {
        label: "restart",
        command: "shutdown",
        args: ["/r", "/t", "5"]
    },
    shutdown: {
        label: "shutdown",
        command: "shutdown",
        args: ["/s", "/t", "5"]
    }
};

export const runPowerAction = async (req, res) => {
    const action = String(req.body?.action || "").toLowerCase();
    const powerAction = POWER_ACTIONS[action];

    if (!powerAction) {
        return res.status(400).json({
            success: false,
            message: "Unsupported power action"
        });
    }

    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
            success: false,
            message: "Laptop power commands are only available when running locally."
        });
    }

    if (process.platform !== "win32") {
        return res.status(400).json({
            success: false,
            message: "Laptop power commands are currently configured for Windows only."
        });
    }

    execFile(powerAction.command, powerAction.args, { windowsHide: true }, (error) => {
        if (error) {
            console.log("Power action error:", error.message);
        }
    });

    return res.json({
        success: true,
        action,
        message: `Laptop ${powerAction.label} command sent.`
    });
};
