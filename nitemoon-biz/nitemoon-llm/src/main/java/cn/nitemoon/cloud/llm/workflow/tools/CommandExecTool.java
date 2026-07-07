package cn.nitemoon.cloud.llm.workflow.tools;

import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class CommandExecTool implements BuiltInTool {

    @Value("${tool.command-exec.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${tool.command-exec.max-output-length:10000}")
    private int maxOutputLength;

    @Value("${tool.command-exec.work-dir:}")
    private String workDir;

    @Tool("Execute a system command or script. Input: the command string to execute (e.g. 'python3 script.py', 'ls -la', 'bash script.sh'). Returns: the combined stdout and stderr output of the command.")
    public String executeCommand(String command) {
        StreamEmitter emitter = ToolContextHolder.getEmitter();
        if (emitter != null) {
            emitter.send(ChatRes.toolCall("COMMAND_EXEC", "Executing: " + command));
        }
        log.info("Tool[COMMAND_EXEC] 执行, command: {}", command);

        try {
            ProcessBuilder pb = new ProcessBuilder("bash", "-c", command);
            if (workDir != null && !workDir.isBlank()) {
                pb.directory(new File(workDir));
            }
            pb.redirectErrorStream(true);

            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (output.length() > 0) output.append("\n");
                    output.append(line);
                    if (output.length() > maxOutputLength) {
                        output.append("\n... (output truncated)");
                        break;
                    }
                }
            }

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return "Command timed out after " + timeoutSeconds + " seconds.\n" + output;
            }

            int exitCode = process.exitValue();
            String result = output.toString();
            if (exitCode != 0) {
                result = "Exit code: " + exitCode + "\n" + result;
            }
            return result;
        } catch (Exception e) {
            log.error("命令执行异常: {}", e.getMessage());
            return "Command execution error: " + e.getMessage();
        }
    }

    @Override
    public String getToolType() {
        return "COMMAND_EXEC";
    }
}
