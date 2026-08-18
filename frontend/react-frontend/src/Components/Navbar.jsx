import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("https://to-do-list-1j7r.onrender.com", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("https://to-do-list-1j7r.onrender.com/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <nav>
      {user ? (
        <>
          <Link to="/dashboard">Dashboard</Link>

          <span> | </span>

          <span>Hello, {user.username}!</span>

          <span> | </span>

          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/register">Register</Link>

          <span> | </span>

          <Link to="/login">Login</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;