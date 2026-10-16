import { NavLink } from 'react-router'

// The header is shown on every screen: the store name and the navigation.
// It uses NavLink so the active page button is highlighted automatically.
function SiteHeader({ adminUser, onLogout }) {
  return (
    <header className="site-header">
      <p className="store-name">My Clothing Store</p>

      <nav className="site-nav">
        {/* Shop link — goes to the home page. */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'nav-button nav-button-active' : 'nav-button'
          }
        >
          Shop
        </NavLink>

        {/* Logged-out visitors see the login link. */}
        {!adminUser && (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'nav-button nav-button-active' : 'nav-button'
            }
          >
            Admin login
          </NavLink>
        )}

        {/* Logged-in admin sees the dashboard link. */}
        {adminUser && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? 'nav-button nav-button-active' : 'nav-button'
            }
          >
            Admin dashboard
          </NavLink>
        )}

        {/* Logged-in admin sees the logout button. */}
        {adminUser && (
          <button type="button" className="nav-button" onClick={onLogout}>
            Log out
          </button>
        )}
      </nav>
    </header>
  )
}

export default SiteHeader
