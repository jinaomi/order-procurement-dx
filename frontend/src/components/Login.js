import LoadingSpinner from "./until/LoadingSpinner.js";
import { useRef, useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, Box, Card, CardContent, TextField, Typography } from "@mui/material";

import axios from "../api/axios";
import FormButton from "./until/FormButton";
const LOGIN_URL = "/api/Account/login";

const Login = () => {
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const userRef = useRef();
  const errRef = useRef();

  const [username, setUser] = useState("");
  const [password, setPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    setLoading(false);
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [username, password]);

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ username, password }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const accessToken = response?.data?.accessToken;
      const roles = response?.data?.roles;
      var tokenStorage = {
        accessToken: accessToken,
        roles: roles,
        username: username,
        password: password,
      };
      localStorage.setItem("AuthToken", JSON.stringify(tokenStorage));
      setAuth({ username, password, roles, accessToken });
      setUser("");
      setPwd("");
      navigate(from, { replace: true });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (!err?.response) {
        setErrMsg("サーバーから応答がありません");
      } else if (err.response?.status === 400) {
        setErrMsg("ユーザー名またはパスワードが正しくありません。");
      } else if (err.response?.status === 401) {
        setErrMsg("ユーザー名またはパスワードが正しくありません。");
      } else {
        setErrMsg("ログインに失敗しました");
      }
      errRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
        background: (theme) =>
          `linear-gradient(160deg, ${theme.palette.background.default} 60%, ${theme.palette.primary.light}22)`,
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", mx: 2 }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: 700, color: "primary.main", mb: 3 }}
          >
            受注・仕入 業務管理システム
          </Typography>

          {errMsg && (
            <Alert ref={errRef} severity="error" tabIndex={-1} sx={{ mb: 2 }}>
              {errMsg}
            </Alert>
          )}

          <LoadingSpinner loading={loading}></LoadingSpinner>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="ユーザー名"
              id="username"
              inputRef={userRef}
              autoComplete="off"
              onChange={(e) => setUser(e.target.value)}
              value={username}
              required
              fullWidth
            />
            <TextField
              label="パスワード"
              id="password"
              type="password"
              onChange={(e) => setPwd(e.target.value)}
              value={password}
              required
              fullWidth
            />
            <FormButton itemName="ログイン" type="submit" />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
