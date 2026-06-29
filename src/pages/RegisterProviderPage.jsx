import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";
import { getCategories } from "../api/categoryApi";
import { unwrapList } from "../api/normalizers";
import {
  addProviderServiceArea,
  saveProviderAvailability,
  uploadProviderImage,
} from "../api/providerApi";

const WORKING_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const INITIAL_AVAILABILITY = Object.fromEntries(
  WORKING_DAYS.map((day) => [day, { selected: false, startTime: "", endTime: "" }])
);

export default function RegisterProviderPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    experienceYears: "",
    bio: "",
    aadhaarNumber: "",
    categoryId: "",
    customServiceName: "",
    price: "",
    locality: "",
    city: "",
    state: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availability, setAvailability] = useState(INITIAL_AVAILABILITY);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const { registerProvider } = useAuth();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateCategory = (event) => {
    const categoryId = event.target.value;
    const selectedCategory = categories.find(
      (category) => String(category.id) === String(categoryId)
    );
    setForm({
      ...form,
      categoryId,
      customServiceName: isOthersCategory(selectedCategory) ? form.customServiceName : "",
    });
  };
  const updateAadhaar = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
    const formatted = digits.match(/.{1,4}/g)?.join(" ") || "";
    setForm({ ...form, aadhaarNumber: formatted });
  };
  const updateProfileImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setProfileImageFile(null);
      setProfileImagePreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) || !allowedExtension) {
      event.target.value = "";
      setProfileImageFile(null);
      setProfileImagePreview("");
      setError("Choose a JPG, JPEG, PNG or WEBP image.");
      return;
    }

    setError("");
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };
  const updateAvailability = (day, field, value) => {
    setAvailability((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
        ...(field === "selected" && !value ? { startTime: "", endTime: "" } : {}),
      },
    }));
  };

  useEffect(() => {
    getCategories()
      .then((response) => setCategories(unwrapList(response)))
      .catch((err) => setError(err.message || "Unable to load service categories."));
  }, []);

  useEffect(
    () => () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    },
    [profileImagePreview]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedCategory = categories.find(
      (category) => String(category.id) === String(form.categoryId)
    );
    const isCustomService = isOthersCategory(selectedCategory);

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Fill in your name, email, phone number and password to continue.");
      return;
    }
    if (!form.categoryId) {
      setError("Select a service category to continue.");
      return;
    }
    if (isCustomService && !form.customServiceName.trim()) {
      setError("Specify your service to continue.");
      return;
    }
    if (form.price === "") {
      setError("Enter your service price to continue.");
      return;
    }
    if (form.experienceYears === "") {
      setError("Enter your years of experience to continue.");
      return;
    }
    if (!form.locality.trim() || !form.city.trim() || !form.state.trim()) {
      setError("Enter your locality, city and state to continue.");
      return;
    }
    if (!profileImageFile) {
      setError("Select a provider profile image to continue.");
      return;
    }
    const aadhaarNumber = form.aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setError("Enter a valid 12-digit Aadhaar number.");
      return;
    }

    const selectedAvailability = WORKING_DAYS
      .filter((day) => availability[day].selected)
      .map((day) => ({ day, ...availability[day] }));

    if (selectedAvailability.length === 0) {
      setError("Select at least one working day to continue.");
      return;
    }

    const incompleteDay = selectedAvailability.find(
      ({ startTime, endTime }) => !startTime || !endTime
    );
    if (incompleteDay) {
      setError(`Enter both start and end time for ${formatDay(incompleteDay.day)}.`);
      return;
    }

    const invalidTimeDay = selectedAvailability.find(
      ({ startTime, endTime }) => endTime <= startTime
    );
    if (invalidTimeDay) {
      setError(`End time must be after start time for ${formatDay(invalidTimeDay.day)}.`);
      return;
    }

    setError("");
    setNotice(null);
    setSubmitting(true);

    let profileImageUrl;
    try {
      const uploadResponse = await uploadProviderImage(profileImageFile);
      profileImageUrl =
        uploadResponse?.imageUrl ??
        uploadResponse?.data?.imageUrl ??
        uploadResponse?.url;

      if (!profileImageUrl) {
        throw new Error("Image uploaded, but no image URL was returned.");
      }
    } catch (err) {
      setError(
        `Unable to upload provider image. ${
          err.message || "Please check the file and try again."
        }`
      );
      setSubmitting(false);
      return;
    }

    try {
      const registeredUser = await registerProvider({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        experienceYears: Number(form.experienceYears),
        bio: form.bio,
        profileImageUrl,
        aadhaarNumber,
        categoryId: Number(form.categoryId),
        customServiceName: isCustomService ? form.customServiceName.trim() : undefined,
        price: Number(form.price),
        priceUnit: "VISIT",
      });

      setRegistrationComplete(true);
      const providerId =
        registeredUser?.providerId ?? registeredUser?.userId ?? registeredUser?.id;

      try {
        if (providerId === undefined || providerId === null) {
          throw new Error("Provider ID was not returned after registration.");
        }

        const availabilityResult = await Promise.allSettled(
          selectedAvailability.map(({ day, startTime, endTime }) =>
            saveProviderAvailability(providerId, {
              dayOfWeek: day,
              startTime: `${startTime}:00`,
              endTime: `${endTime}:00`,
              available: true,
            })
          )
        );
        const serviceAreaResult = await Promise.allSettled([
          addProviderServiceArea(providerId, {
            locality: form.locality.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
          }),
        ]);

        const availabilityFailed = availabilityResult.some(
          (result) => result.status === "rejected"
        );
        const serviceAreaFailed = serviceAreaResult.some(
          (result) => result.status === "rejected"
        );

        if (availabilityFailed || serviceAreaFailed) {
          setNotice({
            type: "warning",
            text:
              availabilityFailed && serviceAreaFailed
                ? "Registration submitted, but availability and service area could not be saved. You can update them later."
                : availabilityFailed
                  ? "Registration submitted, but availability could not be saved. You can update it later."
                  : "Registration submitted, but service area could not be saved. You can update it later.",
          });
        } else {
          setNotice({
            type: "success",
            text: "Registration submitted. Waiting for admin approval.",
          });
        }
      } catch {
        setNotice({
          type: "warning",
          text: "Registration submitted, but availability could not be saved. You can update it later.",
        });
      }
    } catch (err) {
      setError(err.message || "Unable to submit your provider application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <div>
          <span className="eyebrow on-dark">Join as a provider</span>
          <h2>Your tools, your hours, more customers.</h2>
          <div className="auth-side-points">
            <div className="auth-side-point">
              <ToolIcon name="calendar" size={18} />
              <span>Set your own availability — accept jobs that fit your schedule.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="shield" size={18} />
              <span>Verified badge after a quick ID check builds customer trust fast.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="star" size={18} />
              <span>Top-rated providers get featured on the homepage every week.</span>
            </div>
          </div>
        </div>
        <div className="auth-side-quote">
          "Sahayak filled my calendar within two weeks of signing up." — Devendra, Carpenter
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-form-card provider-registration-card">
          <span className="eyebrow">Provider sign-up</span>
          <h1>Register as a service provider</h1>
          <p className="auth-sub">Already on Sahayak? <Link to="/login">Log in instead</Link>.</p>

          {error && (
            <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
              <ToolIcon name="shield" size={15} /> {error}
            </div>
          )}

          {notice && (
            <div
              className="auth-alert"
              style={
                notice.type === "warning"
                  ? { background: "#fff3d6", color: "#76510b" }
                  : { background: "#e3f3e8", color: "#25613c" }
              }
            >
              <ToolIcon name={notice.type === "warning" ? "calendar" : "check"} size={15} />
              {notice.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-field-group">
                <label htmlFor="prov-name">Full name</label>
                <div className="input-with-icon">
                  <ToolIcon name="user" size={17} />
                  <input
                    id="prov-name"
                    type="text"
                    placeholder="Ramesh Yadav"
                    value={form.name}
                    onChange={update("name")}
                  />
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-phone">Phone number</label>
                <div className="input-with-icon">
                  <ToolIcon name="phone" size={17} />
                  <input
                    id="prov-phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={update("phone")}
                  />
                </div>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="prov-email">Email address</label>
              <div className="input-with-icon">
                <ToolIcon name="mail" size={17} />
                <input
                  id="prov-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update("email")}
                />
              </div>
            </div>

            <fieldset className="provider-service-area-fields">
              <legend>Identity and profile</legend>
              <p className="field-hint">
                Your Aadhaar is used for verification and will only be shown in masked form.
              </p>
              <div className="form-field-group">
                <label htmlFor="prov-image">Provider profile image</label>
                <div className="input-with-icon">
                  <ToolIcon name="user" size={17} />
                  <input
                    id="prov-image"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={updateProfileImage}
                    disabled={submitting || registrationComplete}
                    required
                  />
                </div>
                <p className="field-hint">JPG, JPEG, PNG or WEBP.</p>
                {profileImagePreview && (
                  <div className="provider-image-preview">
                    <img src={profileImagePreview} alt="Selected provider profile preview" />
                    <span>{profileImageFile?.name}</span>
                  </div>
                )}
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-aadhaar">Aadhaar number</label>
                <div className="input-with-icon">
                  <ToolIcon name="shield" size={17} />
                  <input
                    id="prov-aadhaar"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="1234 5678 9012"
                    value={form.aadhaarNumber}
                    onChange={updateAadhaar}
                    maxLength={14}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <div className="form-row-2">
              <div className="form-field-group">
                <label htmlFor="prov-category">Primary service</label>
                <div className="input-with-icon">
                  <ToolIcon name="filter" size={17} />
                  <select
                    id="prov-category"
                    value={form.categoryId}
                    onChange={updateCategory}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label || category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-exp">Years of experience</label>
                <div className="input-with-icon">
                  <ToolIcon name="star" size={17} />
                  <input
                    id="prov-exp"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.experienceYears}
                    onChange={update("experienceYears")}
                    required
                  />
                </div>
              </div>
            </div>

            {isOthersCategory(
              categories.find((category) => String(category.id) === String(form.categoryId))
            ) && (
              <div className="form-field-group">
                <label htmlFor="prov-custom-service">Specify your service</label>
                <div className="input-with-icon">
                  <ToolIcon name="wrench" size={17} />
                  <input
                    id="prov-custom-service"
                    type="text"
                    placeholder="e.g. Appliance repair"
                    value={form.customServiceName}
                    onChange={update("customServiceName")}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-row-2">
              <div className="form-field-group">
                <label htmlFor="prov-price">Price per visit</label>
                <div className="input-with-icon">
                  <ToolIcon name="star" size={17} />
                  <input
                    id="prov-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={form.price}
                    onChange={update("price")}
                    required
                  />
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-price-unit">Price unit</label>
                <div className="input-with-icon">
                  <ToolIcon name="calendar" size={17} />
                  <input id="prov-price-unit" type="text" value="Per visit" disabled />
                </div>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="prov-bio">Professional bio</label>
              <div className="input-with-icon">
                <ToolIcon name="user" size={17} />
                <textarea
                  id="prov-bio"
                  rows="4"
                  placeholder="Tell customers about your experience and services."
                  value={form.bio}
                  onChange={update("bio")}
                />
              </div>
            </div>

            <fieldset className="provider-service-area-fields">
              <legend>Primary service area</legend>
              <p className="field-hint">
                Customers use this location to find providers near them.
              </p>
              <div className="form-row-2">
                <div className="form-field-group">
                  <label htmlFor="prov-locality">Locality</label>
                  <div className="input-with-icon">
                    <ToolIcon name="pin" size={17} />
                    <input
                      id="prov-locality"
                      type="text"
                      placeholder="Thane West"
                      value={form.locality}
                      onChange={update("locality")}
                      required
                    />
                  </div>
                </div>
                <div className="form-field-group">
                  <label htmlFor="prov-city">City</label>
                  <div className="input-with-icon">
                    <ToolIcon name="pin" size={17} />
                    <input
                      id="prov-city"
                      type="text"
                      placeholder="Thane"
                      value={form.city}
                      onChange={update("city")}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-state">State</label>
                <div className="input-with-icon">
                  <ToolIcon name="pin" size={17} />
                  <input
                    id="prov-state"
                    type="text"
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={update("state")}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="provider-availability">
              <legend>Working days and availability</legend>
              <p className="field-hint">
                Select at least one day and add the hours when customers can book you.
              </p>

              <div className="provider-availability-list">
                {WORKING_DAYS.map((day) => {
                  const dayAvailability = availability[day];

                  return (
                    <div
                      className={`provider-availability-row ${
                        dayAvailability.selected ? "selected" : ""
                      }`}
                      key={day}
                    >
                      <label className="provider-day-check">
                        <input
                          type="checkbox"
                          checked={dayAvailability.selected}
                          onChange={(event) =>
                            updateAvailability(day, "selected", event.target.checked)
                          }
                        />
                        <span>{formatDay(day)}</span>
                      </label>

                      <div className="provider-time-fields">
                        <label>
                          <span>Start</span>
                          <input
                            type="time"
                            value={dayAvailability.startTime}
                            disabled={!dayAvailability.selected}
                            onChange={(event) =>
                              updateAvailability(day, "startTime", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          <span>End</span>
                          <input
                            type="time"
                            value={dayAvailability.endTime}
                            disabled={!dayAvailability.selected}
                            onChange={(event) =>
                              updateAvailability(day, "endTime", event.target.value)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="form-field-group">
              <label htmlFor="prov-password">Create a password</label>
              <div className="input-with-icon">
                <ToolIcon name="shield" size={17} />
                <input
                  id="prov-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={update("password")}
                />
              </div>
            </div>

            <div className="form-check-row">
              <label>
                <input type="checkbox" defaultChecked /> I agree to the <a href="#terms">Provider Terms</a> &amp; background check
              </label>
            </div>

            <button
              type="submit"
              className="btn-sahayak btn-sahayak-primary btn-block"
              disabled={submitting || registrationComplete}
            >
              {submitting
                ? "Submitting..."
                : registrationComplete
                  ? "Registration submitted"
                  : "Submit application"}
            </button>
          </form>

          <p className="auth-footer-link">
            Looking to hire instead?{" "}
            <Link to="/register">Register as a customer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDay(day) {
  return day[0] + day.slice(1).toLowerCase();
}

function isOthersCategory(category) {
  return [category?.label, category?.name, category?.categoryName, category?.slug, category?.id]
    .some((value) => String(value || "").trim().toLowerCase() === "others");
}
