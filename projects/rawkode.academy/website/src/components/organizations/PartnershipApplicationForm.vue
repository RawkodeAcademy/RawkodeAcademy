<template>
	<div :class="s.root">
		<p role="status" aria-live="polite" aria-atomic="true" :class="ready ? s.hidden : s.copy">{{ statusMessage }}</p>
		<p :id="errorId" role="alert" aria-atomic="true" :class="error ? s.error : s.hidden">{{ error }}</p>
		<p v-if="fallback" :class="s.copy">
			<a :href="fallbackMailto">Email David directly</a> with the details you entered.
		</p>
		<div v-if="submitted" :class="[s.panel, s.status]">
			<h3 :class="s.heading">Enquiry received</h3>
			<p :class="s.copy">David reads every enquiry and replies within two business days.</p>
		</div>
		<form
			v-else
			method="POST"
			action="?_action=partnership.applyForm"
			:class="s.form"
			@submit="onSubmit"
			:aria-busy="loading"
			:aria-describedby="error ? errorId : undefined"
		>
			<fieldset :class="[s.form, 'form-controls']" :disabled="loading" aria-label="Product review enquiry" @input="trackStarted">
				<div class="form-honeypot" aria-hidden="true">
					<label :for="honeypotId">Website</label>
					<input
						:id="honeypotId"
						v-model="website"
						type="text"
						name="website"
						tabindex="-1"
						autocomplete="off"
					/>
				</div>
				<div :class="s.row">
					<div :class="s.field">
						<label :class="s.label" :for="nameId">Name</label>
						<input
							:id="nameId"
							v-model="name"
							:class="s.input"
							type="text"
							name="name"
							autocomplete="name"
							required
							:aria-invalid="fieldErrors.name ? 'true' : undefined"
						/>
						<p v-if="fieldErrors.name" :class="s.fieldError">{{ fieldErrors.name }}</p>
					</div>
					<div :class="s.field">
						<label :class="s.label" :for="emailId">Work email</label>
						<input
							:id="emailId"
							v-model="email"
							:class="s.input"
							type="email"
							name="email"
							autocomplete="email"
							required
							:aria-invalid="fieldErrors.email ? 'true' : undefined"
						/>
						<p v-if="fieldErrors.email" :class="s.fieldError">{{ fieldErrors.email }}</p>
					</div>
				</div>

				<div :class="s.field">
					<label :class="s.label" :for="companyId">Company</label>
					<input
						:id="companyId"
						v-model="company"
						:class="s.input"
						type="text"
						name="company"
						autocomplete="organization"
						required
						:aria-invalid="fieldErrors.company ? 'true' : undefined"
					/>
					<p v-if="fieldErrors.company" :class="s.fieldError">{{ fieldErrors.company }}</p>
				</div>

				<div :class="s.field">
					<label :class="s.label" :for="pathId">Preferred route</label>
					<select :id="pathId" v-model="path" :class="s.input" name="path" required>
						<option v-for="option in applicationPaths" :key="option" :value="option">{{ option }}</option>
					</select>
				</div>

				<div :class="s.field">
					<label :class="s.label" :for="messageId">Message</label>
					<textarea
						:id="messageId"
						v-model="message"
						:class="[s.input, s.textarea]"
						name="message"
						rows="4"
						required
						:aria-invalid="fieldErrors.message ? 'true' : undefined"
					/>
					<p v-if="fieldErrors.message" :class="s.fieldError">{{ fieldErrors.message }}</p>
				</div>

				<button type="submit" :class="s.button" :disabled="loading">
					{{ loading ? "Sending enquiry..." : "Send enquiry" }}
				</button>
			</fieldset>
			<p v-if="!ready" :class="s.copy">You can <a href="mailto:david@rawkode.academy">email us directly</a> instead.</p>
		</form>
	</div>
</template>

<script setup lang="ts">
import { actions, isInputError } from "astro:actions";
import { academyForms } from "@rawkodeacademy/design-system";
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import {
	type ApplicationPath,
	applicationPathDeals,
	applicationPaths,
	resolveApplicationPath,
} from "@/lib/partnerships";

const props = withDefaults(defineProps<{ initialPath?: ApplicationPath }>(), {
	initialPath: "Not sure yet",
});

const s = academyForms();
const errorId = `${useId()}-error`;
const honeypotId = `${useId()}-website`;
const nameId = useId();
const emailId = useId();
const companyId = useId();
const pathId = useId();
const messageId = useId();

const FALLBACK_ERROR =
	"We could not send your enquiry. Please email david@rawkode.academy directly.";

const name = ref("");
const email = ref("");
const company = ref("");
const path = ref<ApplicationPath>(props.initialPath);
const message = ref("");
const website = ref("");

const ready = ref(false);
const loading = ref(false);
const submitted = ref(false);
const formStarted = ref(false);
const fallback = ref(false);
const error = ref("");
const fieldErrors = ref<Record<string, string>>({});
const fallbackMailto = computed(() => {
	const subject = encodeURIComponent("Product review enquiry");
	const body = encodeURIComponent(
		[
			`Name: ${name.value}`,
			`Email: ${email.value}`,
			`Company: ${company.value}`,
			`Help requested: ${path.value}`,
			"",
			message.value,
		].join("\n"),
	);
	return `mailto:david@rawkode.academy?subject=${subject}&body=${body}`;
});
const statusMessage = computed(() => {
	if (!ready.value) return "Loading enquiry form...";
	if (submitted.value)
		return "Enquiry received. David reads every enquiry and replies within two business days.";
	return loading.value ? "Sending enquiry..." : "";
});

const isApplicationPath = (value: string): value is ApplicationPath =>
	(applicationPaths as readonly string[]).includes(value);

const onDocumentClick = (event: MouseEvent) => {
	const target = event.target as HTMLElement | null;
	const trigger = target?.closest<HTMLElement>("[data-apply-path]");
	const value = trigger?.dataset.applyPath;
	if (value && isApplicationPath(value)) {
		path.value = value;
	}
};

onMounted(() => {
	ready.value = true;
	const route = resolveApplicationPath(
		new URLSearchParams(window.location.search).get("route"),
	);
	if (route) {
		path.value = route;
	}
	document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", onDocumentClick);
});

const capturePartnershipEvent = (
	event: "enquiry_form_started" | "enquiry_form_submitted",
) => {
	window.posthog?.capture(event, {
		form: "partnership_enquiry",
		path: window.location.pathname,
		route: path.value,
		...(event === "enquiry_form_submitted"
			? { offer: applicationPathDeals[path.value].offer }
			: {}),
	});
};

const trackStarted = (event: Event) => {
	const target = event.target;
	if (
		formStarted.value ||
		!(
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement
		) ||
		!target.matches(
			"input:not([type='hidden']):not([name='website']), textarea",
		) ||
		target.value.length === 0
	) {
		return;
	}
	formStarted.value = true;
	capturePartnershipEvent("enquiry_form_started");
};

const onSubmit = (event: Event) => {
	if (!ready.value) return;
	event.preventDefault();
	if (loading.value) return;
	void submit();
};

async function submit() {
	if (!ready.value || loading.value) return;
	error.value = "";
	fieldErrors.value = {};
	fallback.value = false;
	loading.value = true;

	try {
		const result = await actions.partnership.apply({
			name: name.value,
			email: email.value,
			company: company.value,
			path: path.value,
			message: message.value,
			website: website.value,
		});

		if (result.error) {
			if (isInputError(result.error)) {
				fieldErrors.value = Object.fromEntries(
					Object.entries(result.error.fields).map(([field, messages]) => [
						field,
						messages?.[0] ?? "Please check this field",
					]),
				);
				error.value = "Please check the highlighted fields.";
			} else {
				error.value = result.error.message || FALLBACK_ERROR;
			}
		} else if (result.data?.success) {
			submitted.value = true;
			if (result.data.accepted !== false) {
				capturePartnershipEvent("enquiry_form_submitted");
			}
		} else if (result.data?.rateLimited) {
			error.value =
				"Too many enquiries were sent recently. Please wait a minute and try again.";
		} else {
			fallback.value = true;
			error.value =
				"Attio is not available, so your enquiry was not sent automatically.";
		}
	} catch {
		fallback.value = true;
		error.value = FALLBACK_ERROR;
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.form-controls {
	margin: 0;
	padding: 0;
	border: 0;
	min-inline-size: 0;
}

.form-honeypot {
	position: absolute;
	inset-inline-start: -100vw;
	inline-size: 1px;
	block-size: 1px;
	overflow: hidden;
}
</style>
