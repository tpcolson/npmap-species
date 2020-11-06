/* global _:false, $:false */

function Request(options) {
	options = this.options = options || {};

	this.aborted = false;
	this.last_error = null;

	this.retries = 0;
	this.retryCount = options.retryCount || this.defaults.retryCount;
	this.retryTimeout = options.retryTimeout || this.defaults.retryTimeout;

	var old_success = options.success || function () { };
	options.success = this.success();

	var old_error = options.error || function () { };
	options.error = this.error();

	this.deferred = $.Deferred().done(old_success).fail(old_error);
	this.jqXHR = null;

	// resetp is true here so that the initial request is immediate
	this.attempt();
}

Request.prototype = {
	defaults: {
		retryCount: 3,
		retryTimeout: 3000
	},

	abort: function (permanentp) {
		this.aborted = true;

		var abortPromise = $.Deferred();

		var message = 'Request cancelled by user';
		if (!this.jqXHR) {
			if (permanentp)
				this.deferred.reject(null, 'cancelled', message);
			return abortPromise.resolve();
		}

		// Prevent additional automatic attempts
		this.retries = this.retryCount;

		var request = this;
		this.jqXHR.abort(message).fail(function (jqXHR, textStatus, errorThrown) {
			if (permanentp)
				request.deferred.rejectWith(this, jqXHR, textStatus, errorThrown);
			abortPromise.resolve();
		});

		return abortPromise;
	},

	/**
	 * Attempt the request if possible
	 */
	attempt: function () {
		if (this.state() === 'resolved')
			return;

		this.jqXHR = $.ajax(this.options);
	},

	/**
	 * Wrapper for Deferred.done
	 */
	done: function (cb) {
		this.deferred.done(cb);
		return this;
	},

	/**
	 * Generate the error callback.
	 */
	error: function () {
		var request = this;

		// The context for this function will be the options object.
		return function (jqXHR, textStatus, errorThrown) {
			request.last_error = {
				context: this,
				jqXHR: jqXHR,
				textStatus: textStatus,
				errorThrown: errorThrown
			};

			if (!request.aborted)
				request.retry();
		};
	},

	/**
	 * Wrapper for Deferred.fail
	 */
	fail: function (cb) {
		this.deferred.fail(cb);
		return this;
	},

	retry: function (immediate) {
		if (this.state() === 'resolved' || this.aborted)
			return;

		var timeout = immediate ? 0 : this.retryTimeout;

		if (this.retries++ < this.retryCount)
			window.setTimeout(function () {
				if (!this.aborted)
					this.attempt();
			}.bind(this), timeout);
	},

	/**
	 * Wrapper for Deferred.state
	 * TODO document "recoverable"
	 */
	state: function () {
		if (this.deferred.state() !== 'pending')
			return this.deferred.state();

		return this.last_error ? 'recoverable' : 'pending';
	},

	/**
	 * Generate the success callback.
	 */
	success: function () {
		var request = this;

		return function (data, textStatus, jqXHR) {
			request.deferred.resolveWith(this, [data, textStatus, jqXHR]);
		};
	}
};
