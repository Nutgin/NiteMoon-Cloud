import common from "./common.json";
import sys from "./sys.json";
import llm from "./llm.json";
import monitor from "./monitor.json";
import blog from "./blog.json";
import system from "./system.json";
import ai from "./ai.json";
import dashboard from "./dashboard.json";
import graph from "./graph.json";
import oss from "./oss.json";
import scheduled from "./scheduled.json";
import human from "./human.json";
import aiexcel from "./aiexcel.json";
import generator from "./generator.json";
import workflow from "./workflow.json";

export default {
	...common,
	...sys,
	...llm,
	...monitor,
	...system,
	...ai,
	...dashboard,
	...oss,
	...scheduled,
	...generator,
	...workflow,
};
