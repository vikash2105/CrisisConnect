"use client"

import { useState, useEffect } from "react"

// --- Helper Components ---

const Spinner = ({ size = "h-5 w-5" }) => (
  <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-primary-foreground`}></div>
)

const PasswordField = ({
  id,
  name,
  placeholder,
  value,
  onChange,
  error,
  disabled,
  onFocus,
  onBlur,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  return (
    <div className="relative md:col-span-1">
      <input
        type={isPasswordVisible ? "text" : "password"}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full px-4 py-3 bg-input text-foreground border ${
          error ? "border-destructive" : "border-border"
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button
        type="button"
        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        className="absolute inset-y-0 right-0 px-4 flex items-center text-muted-foreground hover:text-foreground"
      >
        {isPasswordVisible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.175 2.175"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.543 7-4.477 0-8.268-2.943-9.543-7z"
            />
          </svg>
        )}
      </button>
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs mt-1 animate-fade-in-up-sm">
          {error}
        </p>
      )}
    </div>
  )
}

const InputField = ({
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled,
  colSpan = "md:col-span-1",
}) => (
  <div className={`relative ${colSpan}`}>
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-3 bg-input text-foreground border ${
        error ? "border-destructive" : "border-border"
      } rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300`}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} className="text-destructive text-xs mt-1 animate-fade-in-up-sm">
        {error}
      </p>
    )}
  </div>
)

const SelectField = ({
  id,
  name,
  value,
  onChange,
  error,
  disabled,
  children,
  colSpan = "md:col-span-2",
}) => (
  <div className={`relative ${colSpan}`}>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-3 bg-input text-foreground border ${
        error ? "border-destructive" : "border-border"
      } rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
    {error && (
      <p id={`${id}-error`} className="text-destructive text-xs mt-1 animate-fade-in-up-sm">
        {error}
      </p>
    )}
  </div>
)

// --- Login Page ---

const LoginPage = ({ onSwitchToCreate, handleAuthSuccess }) => {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors.api) setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.email) newErrors.email = "Email is required."
    if (!formData.password) newErrors.password = "Password is required."
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) {
        setErrors({ api: data.message || "An unknown error occurred." })
      } else {
        handleAuthSuccess(data)
      }
    } catch (error) {
      console.error("Login failed:", error)
      setErrors({ api: "Could not connect to the server. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-card/80 backdrop-blur-lg text-card-foreground rounded-3xl shadow-2xl animate-fade-in border border-border/50">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-4xl font-bold text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground">We're glad to see you again</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.api && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-destructive">{errors.api}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <InputField
                id="login-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={isLoading}
                colSpan="col-span-1"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <PasswordField
                id="login-password"
                name="password"
                value={formData.password}
                onChange={(e) => handleChange(e)}
                error={errors.password}
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-4 flex items-center justify-center font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-ring/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner /> : "Sign In"}
          </button>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToCreate}
              className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors duration-200"
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>

      <div className="pt-6 border-t border-border/30">
        <p className="text-xs text-center text-muted-foreground">
          Trusted by emergency responders and volunteers across India
        </p>
      </div>
    </div>
  )
}

// --- Create Account Page ---

const CreateAccountPage = ({ onSwitchToLogin, handleAuthSuccess }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    serviceLocations: [{ state: "", city: "", district: "" }],
  })

  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState({})
  const [cities, setCities] = useState({})

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(`/api/locations/states`)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to fetch states: ${response.status} ${errorText}`)
        }
        const data = await response.json()
        setStates(data || [])
      } catch (error) {
        console.error("ERROR fetching states:", error)
      }
    }
    fetchStates()
  }, [])

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "password") {
      setPasswordCriteria({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      })
    }
  }

  const handleLocationChange = async (index, e) => {
    const { name, value } = e.target
    const newServiceLocations = [...formData.serviceLocations]
    const currentLocation = { ...newServiceLocations[index] }

    currentLocation[name] = value

    if (name === "state") {
      currentLocation.district = ""
      currentLocation.city = ""
      setDistricts((prev) => ({ ...prev, [index]: [] }))
      setCities((prev) => ({ ...prev, [index]: [] }))
      if (value) {
        try {
          const res = await fetch(`/api/locations/districts/${value}`)
          if (!res.ok) throw new Error("Failed to fetch districts")
          const data = await res.json()
          setDistricts((prev) => ({ ...prev, [index]: data || [] }))
        } catch (e2) {
          console.error("ERROR fetching districts:", e2)
        }
      }
    }

    if (name === "district") {
      currentLocation.city = ""
      setCities((prev) => ({ ...prev, [index]: [] }))
      if (value && currentLocation.state) {
        try {
          const res = await fetch(`/api/locations/cities/${currentLocation.state}/${value}`)
          if (!res.ok) throw new Error("Failed to fetch cities")
          const data = await res.json()
          setCities((prev) => ({ ...prev, [index]: data || [] }))
        } catch (e3) {
          console.error("ERROR fetching cities:", e3)
        }
      }
    }

    newServiceLocations[index] = currentLocation
    setFormData((prev) => ({ ...prev, serviceLocations: newServiceLocations }))
  }

  const handleAddLocation = () => {
    setFormData((prev) => ({
      ...prev,
      serviceLocations: [...prev.serviceLocations, { state: "", city: "", district: "" }],
    }))
  }

  const handleRemoveLocation = (index) => {
    const updatedLocations = formData.serviceLocations.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, serviceLocations: updatedLocations }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullname) newErrors.fullname = "Full name is required."
    if (!formData.email) newErrors.email = "Email is required."
    if (!formData.phone) newErrors.phone = "Phone number is required."

    if (!formData.password) newErrors.password = "Password is required."
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters long."
    else if (!/[a-z]/.test(formData.password)) newErrors.password = "Password must contain at least one lowercase letter."
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = "Password must contain at least one uppercase letter."
    else if (!/[0-9]/.test(formData.password)) newErrors.password = "Password must contain at least one number."
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password))
      newErrors.password = "Password must contain at least one special character."

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match."

    const locationErrors = []
    formData.serviceLocations.forEach((loc, index) => {
      const locError = {}
      if (!loc.state) locError.state = "State is required."
      if (!loc.district) locError.district = "District is required."
      if (!loc.city) locError.city = "City is required."
      if (Object.keys(locError).length > 0) {
        locationErrors[index] = locError
      }
    })

    if (locationErrors.length > 0) newErrors.serviceLocations = locationErrors

    setErrors(newErrors)
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formErrors = validateForm()

    if (Object.keys(formErrors).length > 0) {
      const fieldOrder = ["fullname", "email", "phone", "password", "confirmPassword", "serviceLocations"]
      const firstErrorField = fieldOrder.find((field) => formErrors[field])
      if (firstErrorField) {
        const elementId = firstErrorField === "serviceLocations" ? "state-0" : firstErrorField
        const errorElement = document.getElementById(elementId)
        errorElement?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    setIsLoading(true)
    setApiError("")

    const { confirmPassword, ...registrationPayload } = formData
    const loginPayload = { email: formData.email, password: formData.password }

    try {
      const registerResponse = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
      })
      const registerData = await registerResponse.json()
      if (!registerResponse.ok) {
        setApiError(registerData.message || "An error occurred during registration.")
        setIsLoading(false)
        return
      }

      const loginResponse = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      })
      const loginData = await loginResponse.json()
      if (!loginResponse.ok) {
        setApiError("Account created! Please log in.")
        onSwitchToLogin()
      } else {
        handleAuthSuccess(loginData)
      }
    } catch (error) {
      console.error("Registration or Login process failed:", error)
      setApiError("Could not connect to the server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const CriteriaItem = ({ text, met }) => (
    <li className={`flex items-center text-sm transition-colors ${met ? "text-green-400" : "text-muted-foreground"}`}>
      {met ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {text}
    </li>
  )

  return (
    <div className="w-full max-w-3xl p-8 space-y-6 bg-card text-card-foreground rounded-2xl shadow-lg animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-foreground">Create Account</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {apiError && <p className="text-destructive text-sm text-center">{apiError}</p>}
        <div>
          <label htmlFor="fullname" className="block text-sm font-medium text-muted-foreground mb-1">
            Full Name
          </label>
          <InputField
            id="fullname"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            error={errors.fullname}
            disabled={isLoading}
            colSpan="md:col-span-2"
            placeholder="Full Name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
            Email Address
          </label>
          <InputField
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
            colSpan="md:col-span-2"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">
            Phone Number
          </label>
          <InputField
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            disabled={isLoading}
            colSpan="md:col-span-2"
            placeholder="+91-1234567890"
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
            Password
          </label>
          <PasswordField
            id="password"
            name="password"
            placeholder="Enter a strong password"
            value={formData.password}
            onChange={(e) => handleChange(e)}
            error={errors.password}
            disabled={isLoading}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
          />
          {isPasswordFocused && (
            <div className="absolute top-full mt-2 w-72 z-10 p-3 bg-card border border-border rounded-lg shadow-xl animate-fade-in">
              <ul className="space-y-1">
                <CriteriaItem text="At least 8 characters" met={passwordCriteria.length} />
                <CriteriaItem text="A lowercase letter (a-z)" met={passwordCriteria.lowercase} />
                <CriteriaItem text="An uppercase letter (A-Z)" met={passwordCriteria.uppercase} />
                <CriteriaItem text="A number (0-9)" met={passwordCriteria.number} />
                <CriteriaItem text="A special character (!@#...)" met={passwordCriteria.special} />
              </ul>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">
            Confirm Password
          </label>
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange(e)}
            error={errors.confirmPassword}
            disabled={isLoading}
          />
        </div>

        <div className="md:col-span-2 space-y-4 pt-4">
          <p className="text-muted-foreground font-semibold">Locations You Can Help In</p>
          {formData.serviceLocations.map((location, index) => (
            <div key={index} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground font-semibold">Location {index + 1}</p>
                {formData.serviceLocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(index)}
                    className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-col space-y-4">
                <SelectField
                  id={`state-${index}`}
                  name="state"
                  value={location.state}
                  onChange={(e) => handleLocationChange(index, e)}
                  error={errors.serviceLocations?.[index]?.state}
                  disabled={isLoading}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  id={`district-${index}`}
                  name="district"
                  value={location.district}
                  onChange={(e) => handleLocationChange(index, e)}
                  error={errors.serviceLocations?.[index]?.district}
                  disabled={isLoading || !location.state}
                >
                  <option value="">{location.state ? "Select District" : "Select State First"}</option>
                  {(districts[index] || []).map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  id={`city-${index}`}
                  name="city"
                  value={location.city}
                  onChange={(e) => handleLocationChange(index, e)}
                  error={errors.serviceLocations?.[index]?.city}
                  disabled={isLoading || !location.district}
                >
                  <option value="">{location.district ? "Select City" : "Select District First"}</option>
                  {(cities[index] || []).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddLocation}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-semibold text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-4 focus:ring-ring/50 transition-all duration-300 transform hover:-translate-y-1"
          >
            + Add Location
          </button>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-ring/50 transition-all duration-300 disabled:opacity-70 transform hover:-translate-y-1"
          >
            {isLoading ? <Spinner /> : "Create Account"}
          </button>
        </div>
      </form>
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="font-semibold text-primary hover:underline">
          Sign In
        </button>
      </p>
    </div>
  )
}

// --- Background Animation Component ---

const HelpingHandsBackground = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const hands = Array.from({ length: 15 })
  const HandSvg = () => (
    <svg
      className="w-full h-full"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M62.3,49.2c0.2,0-12.2,2.3-12.2,2.3s-2.1,1-3.7,1.2c-2.3,0.3-4.5,0-4.5,0s-2.2-0.3-3.6-0.8c-1.4-0.5-2.6-1.3-3.2-2.1 c-0.6-0.8-0.7-1.9-0.7-1.9s0.3-2.3,0.3-3.6c0-1.3-0.2-3.6-0.2-3.6s-0.2-2.1,0,1.9c0.2,0.6,0.7,1.1,1.1,1.4c0.4,0.3,0.9,0.5,1.4,0.6c0.7,0.4,1.8,0.6,2.8,0.6 c1,0,2.1,0.2,2.1,0.2s1.7,0.4,2.7,0.9c1,0.5,2.1,1.3,2.8,2.4c0.7,1.1,1,2.7,1,2.7s0.5,2.3,0.5,3.9c0,1.6-0.2,3.1-0.2,3.1 s-0.2,2.1,0,1.9c0.2,0.6,0.7,1.1,1.1,1.4c0.4,0.3,0.9,0.5,1.4,0.6c0.5,0.1,1.1,0.1,1.6,0c0.5-0.1,1-0.3,1.5-0.6c0.5-0.3,0.9-0.7,1.1-1.1c-0.4-0.2-0.9-0.3-1.4-0.3c-0.5,0-1.1,0-1.6,0.1c-0.5,0.1-1,0.3-1.5,0.6c-0.5,0.3-0.9,0.7-1.1,1.1c-0.2,0.4-0.3,0.9-0.3-1.4c0-0.5,0-1.1,0.1-1.6c0.1-0.5,0.3-1,0.6-1.5c0.3-0.5,0.7-0.9,1.1-1.1l0.3,0.1l-0.1,0.1c0,0-2,1.2-2.1,1.3c-0.1,0.1-0.2,0.2-0.2,0.3 v0.3c0,0.1,0.1,0.2,0.2,0.2h0.3c0.1,0,0.2-0.1,0.2-0.2v-0.3c0-0.1-0.1-0.2-0.2-0.2h-0.3c-0.1,0-0.2,0.1-0.2,0.2v0.3 c0,0.1,0.1,0.2,0.2,0.2h0.3c0.1,0,0.2-0.1,0.2-0.2v-0.3c0-0.1-0.1-0.2-0.2-0.2h-0.3c-0.1,0-0.2,0.1-0.2,0.2v0.3 c0,0.1,0.1,0.2,0.2,0.2h0.3c0.1,0,0.2-0.1,0.2-0.2l2.1-1.3l-0.1-0.1l-0.3-0.1c-0.4-0.2-0.8-0.6-1.1-1.1 c-0.3-0.5-0.5-1-0.6-1.5c-0.1-0.5,0-1.1,0.1-1.6c0-0.5,0.2-1,0.3-1.4c0.2-0.4,0.6-0.9,1.1-1.1c0.5-0.3,1-0.5,1.5-0.6 c0.5-0.1,1.1-0.1,1.6,0c0.5,0.1,1,0.3,1.4,0.6c0.4,0.3,0.9,0.7,1.1,1.1c0.2,0.4,0.3,0.9,0.3,1.4c0,0.5-0.1,1.1-0.3,1.6 c-0.2,0.5-0.5,1-1.1,1.4c-0.6,0.4-1.3,0.7-2.1,0.9c-0.8,0.2-1.7,0.3-2.6,0.3s1.8,0.1,2.6,0.3c0.8,0.2,1.5,0.5,2.1,0.9C49.5,41.2,49.5,41.2,49.5,41.2z M49.5,41.2c-0.4-1-1.3-2-2-2.4c-0.7-0.4-1.8-0.6-2.8-0.6c-1,0-2.1,0.2-2.1,0.2s-1.7,0.4-2.7,0.9 c-1,0.5-2.1,1.3-2.8,2.4c-0.7,1.1-1,2.7-1,2.7s-0.5,2.3-0.5,3.9c0,1.6,0.2,3.1,0.2,3.1s0.2,1.3,0,1.9c-0.2,0.6-0.7,1.1-1.1,1.4 c-0.4,0.3-0.9,0.5-1.4,0.6c-0.5,0.1-1.1,0.1-1.6,0c-0.5-0.1-1-0.3-1.5-0.6c-0.5-0.3-0.9-0.7-1.1-1.1c-0.2-0.4-0.3-0.9-0.3-1.4c0,0.5-0.1,1.1-0.3,1.6 c-0.2,0.5-0.5,1-1.1,1.4c-0.6,0.4-1.3,0.7-2.1,0.9c-0.8,0.2-1.7,0.3-2.6,0.3c-0.9,0-1.8,0.1-2.6,0.3 c-0.8,0.2-1.5,0.5-2.1,0.9C49.5,41.2,49.5,41.2,49.5,41.2z" />
    </svg>
  )
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="relative w-full h-full">
        {hands.map((_, i) => {
          const style = {
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 80 + 40}px`,
            animationDuration: `${Math.random() * 20 + 15}s`,
            animationDelay: `${Math.random() * 10}s`,
          }
          return (
            <div key={i} className="floating-hand text-border" style={style}>
              <HandSvg />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- App Component ---
export default function AuthSystem() {
  const [isLoginView, setIsLoginView] = useState(true)

  const handleAuthSuccess = (data) => {
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userData", JSON.stringify(data.user))
    localStorage.setItem("token", data.token)
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center font-sans p-4 overflow-hidden">
      <HelpingHandsBackground />
      <style>{`
        .floating-hand { position: absolute; bottom: -150px; animation: float-up linear infinite; }
        @keyframes float-up { 0% { transform: translateY(0); opacity: 0; } 10%, 90% { opacity: 0.1; } 100% { transform: translateY(-110vh); opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up-sm { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out forwards; }
        .animate-fade-in-up-sm { animation: fade-in-up-sm 0.4s ease-out forwards; }
      `}</style>
      <div className="relative w-full z-10">
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold text-foreground tracking-wider animate-fade-in-down drop-shadow-lg"
            style={{ animationDelay: "0.1s" }}
          >
            CrisisConnect
          </h1>
          <p
            className="text-foreground text-lg mt-2 animate-fade-in-down drop-shadow-md"
            style={{ animationDelay: "0.3s" }}
          >
            Connect. Respond. Save.
          </p>
        </div>
        <div className="flex justify-center">
          {isLoginView ? (
            <LoginPage onSwitchToCreate={() => setIsLoginView(false)} handleAuthSuccess={handleAuthSuccess} />
          ) : (
            <CreateAccountPage onSwitchToLogin={() => setIsLoginView(true)} handleAuthSuccess={handleAuthSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}
