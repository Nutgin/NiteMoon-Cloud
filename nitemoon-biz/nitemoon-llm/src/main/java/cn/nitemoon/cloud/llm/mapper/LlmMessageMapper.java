

package cn.nitemoon.cloud.llm.mapper;

import cn.hutool.core.lang.Dict;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author hetao
 * @date 2025/1/4
 */
@Mapper
public interface LlmMessageMapper extends BaseMapper<LlmMessage> {

    @Select("SELECT\n" +
            "    DATE_SUB(CURDATE(), INTERVAL seq DAY) as date,\n" +
            "    COALESCE(COUNT(*), 0) AS tokens\n" +
            "FROM (\n" +
            "    SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9\n" +
            "    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19\n" +
            "    UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29\n" +
            ") as seq\n" +
            "LEFT JOIN llm_message m ON DATE(m.create_time) = DATE_SUB(CURDATE(), INTERVAL seq DAY) AND m.role = 'assistant'\n" +
            "WHERE seq < 30\n" +
            "GROUP BY DATE_SUB(CURDATE(), INTERVAL seq DAY)\n" +
            "ORDER BY date DESC")
    List<Dict> getReqChartBy30();

    @Select("SELECT\n" +
            "    COALESCE(DATE_FORMAT(create_time, '%Y-%m'), 0) as month,\n" +
            "    COALESCE(COUNT(*), 0) as count\n" +
            "FROM\n" +
            "    llm_message\n" +
            "WHERE\n" +
            "    create_time >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)\n" +
            "    AND role = 'assistant'\n" +
            "GROUP BY\n" +
            "    month\n" +
            "ORDER BY\n" +
            "    month ASC;")
    List<Dict> getReqChart();

    @Select("SELECT\n" +
            "    DATE_SUB(CURDATE(), INTERVAL seq DAY) as date,\n" +
            "    COALESCE(SUM(m.tokens), 0) AS tokens\n" +
            "FROM (\n" +
            "    SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9\n" +
            "    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19\n" +
            "    UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29\n" +
            ") as seq\n" +
            "LEFT JOIN llm_message m ON DATE(m.create_time) = DATE_SUB(CURDATE(), INTERVAL seq DAY) AND m.role = 'assistant'\n" +
            "WHERE seq < 30\n" +
            "GROUP BY DATE_SUB(CURDATE(), INTERVAL seq DAY)\n" +
            "ORDER BY date DESC")
    List<Dict> getTokenChartBy30();

    @Select("SELECT\n" +
            "    COALESCE(DATE_FORMAT(create_time, '%Y-%m'), 0) as month,\n" +
            "    COALESCE(SUM(tokens), 0) as count\n" +
            "FROM\n" +
            "    llm_message\n" +
            "WHERE\n" +
            "    create_time >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)\n" +
            "    AND role = 'assistant'\n" +
            "GROUP BY\n" +
            "    month\n" +
            "ORDER BY\n" +
            "    month ASC;")
    List<Dict> getTokenChart();

    @Select("SELECT\n" +
            "    COALESCE(COUNT(*), 0) AS totalReq,\n" +
            "    COALESCE(SUM( CASE WHEN DATE ( create_time ) = CURDATE() THEN 1 ELSE 0 END ), 0) AS curReq\n" +
            "FROM\n" +
            "    llm_message\n" +
            "WHERE\n" +
            "    role = 'assistant'")
    Dict getCount();

    @Select("SELECT\n" +
            "    COALESCE(SUM(tokens), 0) AS totalToken,\n" +
            "    COALESCE(SUM(CASE WHEN DATE(create_time) = CURDATE() THEN tokens ELSE 0 END), 0) AS curToken\n" +
            "FROM\n" +
            "    llm_message;")
    Dict getTotalSum();
}

