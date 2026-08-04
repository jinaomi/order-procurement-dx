import { useState, useRef, useEffect } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import { useTheme } from "@mui/material/styles";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import chatService from "../services/chatService";
import "../styles/styles.css";

const ChatAssistant = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await chatService.sendMessage(axiosPrivate, text, history);
      setMessages([...nextMessages, { role: "assistant", content: response.data.reply }]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "申し訳ございません、現在AIアシスタントに接続できません。しばらくしてからもう一度お試しください。" },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", maxWidth: 900 }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            受注・在庫・請求・売上について、AIアシスタントに質問できます。（例：「在庫が少ない商品は?」「リスクのある受注は?」「今月の売上は?」）
          </Typography>
        )}
        {messages.map((m, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 1,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: m.role === "user" ? theme.palette.primary.main : theme.palette.secondary.light,
                color: m.role === "user" ? "#fff" : theme.palette.secondary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {m.role === "user" ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                maxWidth: "75%",
                backgroundColor: m.role === "user" ? theme.palette.primary.main : "#f5f5f5",
                color: m.role === "user" ? "#fff" : "inherit",
                whiteSpace: "pre-wrap",
              }}
            >
              <Typography variant="body2">{m.content}</Typography>
            </Paper>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: theme.palette.secondary.light,
                color: theme.palette.secondary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Box>
            <Paper elevation={1} sx={{ p: 1.5, backgroundColor: "#f5f5f5", display: "flex", alignItems: "center" }}>
              <CircularProgress size={16} />
            </Paper>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>
      <Box sx={{ display: "flex", gap: 1, p: 2, borderTop: "1px solid #ddd" }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="質問を入力してください..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatAssistant;
