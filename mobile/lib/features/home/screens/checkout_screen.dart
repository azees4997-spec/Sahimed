import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/notification_service.dart';
import 'order_status_screen.dart';
import 'package:paytmpayments_allinonesdk/paytmpayments_allinonesdk.dart';

class CheckoutScreen extends StatefulWidget {
  final File? initialPrescription;
  const CheckoutScreen({super.key, this.initialPrescription});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _houseController = TextEditingController();
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _phoneController = TextEditingController();

  String _selectedTag = 'Home';
  bool _isProcessing = false;
  bool _isConsultationRequired = false;
  File? _prescriptionImage;
  final ImagePicker _picker = ImagePicker();
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();

  List<Map<String, dynamic>> _savedAddresses = [];
  Map<String, dynamic>? _selectedAddress;
  bool _showAddressForm = true;

  String _paymentMethod = 'Online';
  String? _expectedDelivery;


  @override
  void initState() {
    super.initState();
    _prescriptionImage = widget.initialPrescription;
    _loadData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _houseController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _landmarkController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  // Payment handlers removed as Paytm uses async call
  
  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message.toUpperCase(),
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10),
        ),
        backgroundColor: SahimedColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: const EdgeInsets.all(20),
      ),
    );
  }

  Future<bool> _validateBeforeProcessing() async {
    // 1. Basic Form Validation
    if (_showAddressForm) {
      if (!_formKey.currentState!.validate()) return false;
    } else if (_selectedAddress == null) {
      _showError('PLEASE SELECT A DELIVERY ADDRESS');
      return false;
    }

    // 2. Mandatory Patient Details (Enhanced Enforcement)
    if (_nameController.text.trim().isEmpty || 
        _nameController.text == 'Sahimed User' || 
        _nameController.text == 'N/A') {
      _showError('PATIENT NAME IS MANDATORY FOR ORDER PROCESSING');
      return false;
    }
    if (_phoneController.text.trim().isEmpty || _phoneController.text.length < 10) {
      _showError('VALID 10-DIGIT MOBILE NUMBER IS REQUIRED');
      return false;
    }

    // 3. Prescription Check
    final cart = context.read<CartProvider>();
    if (cart.isRxRequired && _prescriptionImage == null && !_isConsultationRequired) {
      _showError('PRESCRIPTION REQUIRED • PLEASE UPLOAD OR OPT FOR CONSULTATION');
      return false;
    }

    // 4. Serviceability Check (Location)
    setState(() => _isProcessing = true);
    try {
      final pincodeToCheck = _showAddressForm ? _pincodeController.text : _selectedAddress!['pincode'];
      final shipway = await _apiService.getShipwayServiceability(pincodeToCheck);
      final isServiceable = shipway?['serviceable'] == true;
      _expectedDelivery = shipway?['edd'];

      if (!isServiceable) {
        _showError('WE CURRENTLY DO NOT DELIVER TO $pincodeToCheck');
        setState(() => _isProcessing = false);
        return false;
      }
    } catch (e) {
      debugPrint('Serviceability check failed: $e');
    }
    
    return true;
  }



  Future<void> _loadData() async {
    // 1. Pre-fill from Firebase Auth
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      if (_nameController.text.isEmpty) {
        _nameController.text = user.displayName ?? '';
      }
      if (_phoneController.text.isEmpty) {
        _phoneController.text = user.phoneNumber ?? '';
      }
    }

    // 2. Load Saved Addresses
    final addresses = await _apiService.getUserAddresses();
    if (mounted) {
      setState(() {
        _savedAddresses = addresses;
        if (addresses.isNotEmpty) {
          _selectedAddress = addresses.first;
          _showAddressForm = false;
          _fillFormWithAddress(addresses.first);
        }
      });
    }
  }

  void _onCheckout() async {
    if (_paymentMethod == 'Online') {
      await _handleOnlinePayment();
    } else {
      if (await _validateBeforeProcessing()) {
        await _placeOrder();
      }
    }
  }

  Future<void> _autoDetectLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 8),
          ),
        );
        
        List<Placemark> placemarks = await placemarkFromCoordinates(
          pos.latitude,
          pos.longitude,
        );

        if (placemarks.isNotEmpty && mounted) {
          Placemark place = placemarks[0];
          setState(() {
            _streetController.text = place.subLocality ?? place.name ?? '';
            _cityController.text = place.locality ?? '';
            _stateController.text = place.administrativeArea ?? 'Karnataka';
            _pincodeController.text = place.postalCode ?? '';
          });
        }
      }
    } catch (e) {
      debugPrint('Auto-location failed: $e');
    }
  }

  void _fillFormWithAddress(Map<String, dynamic> addr) {
    final user = FirebaseAuth.instance.currentUser;
    _nameController.text = addr['name'] ?? addr['patientName'] ?? user?.displayName ?? '';
    _houseController.text = addr['houseNumber'] ?? '';
    _streetController.text = addr['street'] ?? '';
    _cityController.text = addr['city'] ?? '';
    _stateController.text = addr['state'] ?? 'Karnataka';
    _pincodeController.text = addr['pincode'] ?? '';
    _landmarkController.text = addr['landmark'] ?? '';
    _selectedTag = addr['tag'] ?? 'Home';
    _phoneController.text = addr['phone'] ?? addr['phoneNumber'] ?? user?.phoneNumber ?? '';
  }

  Future<void> _pickImage() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(30),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'SELECT SOURCE',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: Colors.black,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildPickerOption(
                  icon: LucideIcons.camera,
                  label: 'CAMERA',
                  onTap: () {
                    Navigator.pop(context);
                    _handlePick(ImageSource.camera);
                  },
                ),
                _buildPickerOption(
                  icon: LucideIcons.image,
                  label: 'GALLERY',
                  onTap: () {
                    Navigator.pop(context);
                    _handlePick(ImageSource.gallery);
                  },
                ),
                _buildPickerOption(
                  icon: LucideIcons.fileText,
                  label: 'FILES',
                  onTap: () {
                    Navigator.pop(context);
                    _pickFromFiles();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPickerOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: SahimedColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(icon, color: SahimedColors.primary, size: 28),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handlePick(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) {
        setState(() => _prescriptionImage = File(image.path));
      }
    } catch (e) {
      _showError('PICKER ERROR: $e');
    }
  }

  Future<void> _pickFromFiles() async {
    try {
      FilePickerResult? result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() => _prescriptionImage = File(result.files.single.path!));
      }
    } catch (e) {
      _showError('FILE PICKER ERROR: $e');
    }
  }

  Future<void> _handleOnlinePayment() async {
    if (!(await _validateBeforeProcessing())) return;

    if (!mounted) return;
    final cart = context.read<CartProvider>();
    
    try {
      // 1. Initiate Transaction with Backend
      final response = await _apiService.initiatePaytmTransaction(
        amount: cart.finalTotal,
        channel: 'WAP', // Mobile uses WAP
      );

      if (response != null && response['txnToken'] != null) {
        final txnToken = response['txnToken'];
        final orderId = response['orderId'];
        final mid = response['mid'];
        final callbackUrl = response['callbackUrl'];

        // 2. Open Paytm SDK
        var paytmResponse = await PaytmPaymentsAllinonesdk().startTransaction(
          mid?.toString() ?? "",
          orderId?.toString() ?? "",
          cart.finalTotal.toString(),
          txnToken?.toString() ?? "",
          callbackUrl?.toString() ?? "",
          false, // isStaging (production)
          false, // restrictAppInvoke
        );

        if (paytmResponse != null && paytmResponse['STATUS'] == 'TXN_SUCCESS') {
          await _placeOrder(
            paymentId: paytmResponse['TXNID'],
            paytmOrderId: orderId,
          );
        } else {
          _showError('PAYMENT FAILED: ${paytmResponse?['RESPMSG'] ?? 'Unknown Error'}');
        }
      }
    } catch (e) {
      _showError('PAYMENT INITIATION FAILED: $e');
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _placeOrder({
    String? paymentId,
    String? paytmOrderId,
  }) async {
    // 1. Final Safety Check (already mostly handled by _validateBeforeProcessing)
    if (_showAddressForm) {
      if (!_formKey.currentState!.validate()) return;
    } else if (_selectedAddress == null) {
      _showError('Please select an address');
      return;
    }

    final cart = context.read<CartProvider>();
    List<String> prescriptions = [];

    // Ensure processing state
    setState(() => _isProcessing = true);

    try {
      if (_prescriptionImage != null) {
        final url = await _apiService.uploadPrescription(_prescriptionImage!);
        if (url != null) prescriptions.add(url);
      }

      // Capture GPS data with graceful fallback
      Map<String, double?> coords = {'lat': null, 'lng': null};
      try {
        final pos = await _locationService.getCurrentPosition();
        if (pos != null) {
          coords = {'lat': pos.latitude, 'lng': pos.longitude};
        }
      } catch (e) {
        debugPrint(
          'Location access denied or failed: $e. Proceeding with manual address.',
        );
      }

      final shippingDetails = _showAddressForm
          ? {
              'name': _nameController.text,
              'phone': _phoneController.text,
              'houseNumber': _houseController.text,
              'street': _streetController.text,
              'landmark': _landmarkController.text,
              'city': _cityController.text,
              'state': _stateController.text.isNotEmpty
                  ? _stateController.text
                  : 'Karnataka',
              'pincode': _pincodeController.text,
              'lat': coords['lat'],
              'lng': coords['lng'],
              'tag': _selectedTag,
            }
          : {
              ..._selectedAddress!,
              'lat': coords['lat'] ?? _selectedAddress!['lat'],
              'lng': coords['lng'] ?? _selectedAddress!['lng'],
            };

      // Save new address if form is shown
      if (_showAddressForm) {
        await _apiService.saveAddress(shippingDetails);
      }

      final billingBreakdown = {
        'grossMrp': cart.subtotal,
        'subtotal': cart.total,
        'promoDiscount': cart.promoDiscount,
        'promoCode': cart.appliedPromo?.code,
        'walletUsed': 0.0,
        'deliveryFees': cart.deliveryFee, // KEY FIX: must match server-side validator
        'total': cart.finalTotal,
        'campaignDiscount': cart.promoDiscount,
      };

      final orderId = await _apiService.createOrder(
        items: cart.items,
        total: cart.finalTotal,
        shippingDetails: shippingDetails,
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        billingBreakdown: billingBreakdown,
        prescriptions: prescriptions,
        isConsultationRequired: _isConsultationRequired,
        paymentId: paymentId,
        paytmOrderId: paytmOrderId,
      );


      if (mounted) {
        if (orderId != null) {
          // BUG-04 FIX: Capture total BEFORE clearing cart to avoid showing ₹0
          final confirmedTotal = cart.finalTotal;
          final confirmedName = _nameController.text.trim();
          cart.clearCart();
          
          // Trigger local notification for immediate feedback
          NotificationService.showLocalOrderNotification(
            title: 'Order Placed Successfully! 🎉',
            body: 'Your order #$orderId has been received and is being processed.',
          );

          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (context) => OrderStatusScreen(
                isSuccess: true,
                orderId: orderId,
                totalAmount: confirmedTotal,
                patientName: confirmedName,
                paymentMethod: paymentId != null ? 'Online Payment' : 'Cash on Delivery',
                expectedDelivery: _expectedDelivery,
              ),
            ),
            (route) => route.isFirst,
          );
        } else {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const OrderStatusScreen(isSuccess: false),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order failed: $e'),
            backgroundColor: SahimedColors.accent,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: SahimedColors.background,
      appBar: AppBar(
        title: Text(
          'Secure Checkout',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
              20,
              16,
              20,
              220,
            ), // Increased padding for bottom bar
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Patient Details Section (New & Primary)
                _buildSectionCard(
                  title: 'Patient Details',
                  icon: LucideIcons.user,
                  child: Column(
                    children: [
                      _buildTextField(
                        controller: _nameController,
                        label: 'PATIENT NAME (MANDATORY)',
                        hint: 'Full name of the patient',
                        icon: LucideIcons.user,
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _phoneController,
                        label: 'ALTERNATIVE NUMBER (OPTIONAL)',
                        hint: 'Secondary contact number',
                        icon: LucideIcons.phone,
                        keyboardType: TextInputType.phone,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Address Section
                _buildSectionCard(
                  title: 'Shipping Address',
                  icon: LucideIcons.mapPin,
                  child: Column(
                    children: [
                      if (_savedAddresses.isNotEmpty) ...[
                        ..._savedAddresses.map(
                          (addr) => _buildAddressCard(addr),
                        ),
                        TextButton.icon(
                          onPressed: () => setState(() {
                            _showAddressForm = true;
                            _selectedAddress = null;
                            _houseController.clear();
                            _streetController.clear();
                            _cityController.clear();
                            _pincodeController.clear();
                          }),
                          icon: const Icon(LucideIcons.plus, size: 16),
                          label: Text(
                            'Add New Address',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                      if (_showAddressForm)
                        Form(
                          key: _formKey,
                          child: Column(
                            key: const ValueKey('address_form'),
                            children: [
                              // Locate Me Button for Parity
                              ElevatedButton.icon(
                                onPressed: () async {
                                  try {
                                    LocationPermission permission =
                                        await Geolocator.checkPermission();
                                    if (permission ==
                                        LocationPermission.denied) {
                                      permission =
                                          await Geolocator.requestPermission();
                                    }

                                    if (permission ==
                                            LocationPermission.whileInUse ||
                                        permission ==
                                            LocationPermission.always) {
                                      final pos =
                                          await Geolocator.getCurrentPosition();
                                      List<Placemark> placemarks =
                                          await placemarkFromCoordinates(
                                            pos.latitude,
                                            pos.longitude,
                                          );

                                      if (placemarks.isNotEmpty && context.mounted) {
                                        Placemark place = placemarks[0];
                                        setState(() {
                                          _streetController.text =
                                              place.subLocality ??
                                              place.name ??
                                              '';
                                          _cityController.text =
                                              place.locality ?? '';
                                          _stateController.text =
                                              place.administrativeArea ??
                                              'Karnataka';
                                          _pincodeController.text =
                                              place.postalCode ?? '';
                                        });
                                      }
                                    }
                                  } catch (e) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'GPS ACCESS DENIED or FETCH FAILED',
                                          ),
                                        ),
                                      );
                                    }
                                  }
                                },
                                icon: const Icon(
                                  LucideIcons.locateFixed,
                                  size: 16,
                                ),
                                label: Text(
                                  'USE CURRENT LOCATION',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 11,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: SahimedColors.primary
                                      .withOpacity(0.1),
                                  foregroundColor: SahimedColors.primary,
                                  elevation: 0,
                                  minimumSize: const Size(double.infinity, 50),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              _buildTextField(
                                controller: _houseController,
                                label: 'FLAT / HOUSE NO',
                                hint: 'e.g. 101, block A',
                                icon: LucideIcons.house,
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                controller: _streetController,
                                label: 'STREET / AREA',
                                hint: 'e.g. MG Road',
                                icon: LucideIcons.map,
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildTextField(
                                      controller: _cityController,
                                      label: 'CITY',
                                      hint: 'e.g. Bangalore',
                                      icon: LucideIcons.navigation,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildTextField(
                                      controller: _pincodeController,
                                      label: 'PINCODE',
                                      hint: '6 digits',
                                      icon: LucideIcons.hash,
                                      keyboardType: TextInputType.number,
                                      inputFormatters: [
                                        FilteringTextInputFormatter.digitsOnly,
                                        LengthLimitingTextInputFormatter(6),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  _buildTagOption('Home', LucideIcons.house),
                                  const SizedBox(width: 8),
                                  _buildTagOption(
                                    'Office',
                                    LucideIcons.briefcase,
                                  ),
                                  const SizedBox(width: 8),
                                  _buildTagOption('Other', LucideIcons.mapPin),
                                ],
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Consultation Section
                if (cart.isRxRequired)
                  _buildSectionCard(
                    title: 'Prescription',
                    icon: LucideIcons.filePlus,
                    child: Column(
                      children: [
                        _buildPrescriptionUpload(),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: SahimedColors.primary.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                LucideIcons.stethoscope,
                                color: SahimedColors.primary,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Don\'t have a prescription?',
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    Text(
                                      'Our doctors will call you for a free consultation',
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        color: SahimedColors.slate500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Switch.adaptive(
                                value: _isConsultationRequired,
                                activeTrackColor: SahimedColors.primary.withOpacity(0.5),
                                activeColor: SahimedColors.primary,
                                onChanged: (v) =>
                                    setState(() => _isConsultationRequired = v),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 12),
                _buildPaymentMethodSection(),
                const SizedBox(height: 12),
                _buildOrderSummary(cart),
              ],
            ),
          ),
          if (_isProcessing)
            Container(
              color: Colors.white.withOpacity(0.5),
              child: const Center(
                child: CircularProgressIndicator(color: SahimedColors.primary),
              ),
            ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildGlassPlaceOrderBar(cart),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassPlaceOrderBar(CartProvider cart) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 34),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TOTAL PAYABLE',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    color: SahimedColors.slate400,
                    letterSpacing: 1.5,
                  ),
                ),
                Text(
                  '₹${cart.finalTotal.toStringAsFixed(2)}',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    color: SahimedColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 24),
            Expanded(
              child: ElevatedButton(
                onPressed: _isProcessing 
                    ? null 
                    : _onCheckout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: SahimedColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  elevation: 8,
                  shadowColor: SahimedColors.primary.withOpacity(0.4),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _paymentMethod == 'Online' ? 'PAY SECURELY' : 'PLACE ORDER',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(LucideIcons.arrowRight, size: 18),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return _buildSectionCard(
      title: 'Payment Method',
      icon: LucideIcons.creditCard,
      child: Column(
        children: [
          _buildPaymentOption(
            id: 'COD',
            title: 'Cash on Delivery',
            subtitle: 'Pay at your doorstep',
            icon: LucideIcons.banknote,
          ),
          const SizedBox(height: 12),
          _buildPaymentOption(
            id: 'Online',
            title: 'Paytm / Online',
            subtitle: 'UPI, Wallet, Cards & Netbanking',
            icon: LucideIcons.creditCard,
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption({
    required String id,
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    bool isSelected = _paymentMethod == id;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = id),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? SahimedColors.primary.withOpacity(0.05) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? SahimedColors.primary : SahimedColors.slate100,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected ? SahimedColors.primary : SahimedColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : SahimedColors.slate400,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: SahimedColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: SahimedColors.slate500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected ? LucideIcons.circleCheck : LucideIcons.circle,
              color: isSelected ? SahimedColors.primary : SahimedColors.slate200,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressCard(Map<String, dynamic> addr) {
    bool isSelected = (_selectedAddress?['id'] ?? _selectedAddress?['_id']) == (addr['id'] ?? addr['_id']);
    return GestureDetector(
      onTap: () => setState(() {
        _selectedAddress = addr;
        _showAddressForm = false;
      }),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? SahimedColors.primary.withOpacity(0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? SahimedColors.primary : SahimedColors.slate100,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? LucideIcons.circleCheck : LucideIcons.circle,
              color: isSelected
                  ? SahimedColors.primary
                  : SahimedColors.slate300,
              size: 20,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    addr['tag']?.toUpperCase() ?? 'HOME',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w900,
                      fontSize: 10,
                      color: SahimedColors.primary,
                    ),
                  ),
                  Text(
                    '${addr['houseNumber']}, ${addr['street']}',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${addr['city']} - ${addr['pincode']}',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: SahimedColors.slate500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrescriptionUpload() {
    return GestureDetector(
      onTap: _pickImage,
      child: Container(
        width: double.infinity,
        height: 120,
        decoration: BoxDecoration(
          color: SahimedColors.background,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: _prescriptionImage != null
                ? SahimedColors.emerald500
                : SahimedColors.slate200,
            style: BorderStyle.solid,
          ),
        ),
        child: _prescriptionImage != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: _prescriptionImage!.path.toLowerCase().endsWith('.pdf')
                    ? Container(
                        color: Colors.red.withOpacity(0.1),
                        child: const Center(
                          child: Icon(
                            LucideIcons.fileText,
                            color: Colors.red,
                            size: 40,
                          ),
                        ),
                      )
                    : Image.file(_prescriptionImage!, fit: BoxFit.cover),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.camera,
                    color: SahimedColors.primary,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Scan/Upload Prescription',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: SahimedColors.primary,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildTagOption(String tag, IconData icon) {
    bool isSelected = _selectedTag == tag;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTag = tag),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? SahimedColors.primary : SahimedColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected
                  ? SahimedColors.primary
                  : SahimedColors.slate200,
              width: 1.5,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected ? Colors.white : SahimedColors.slate400,
              ),
              const SizedBox(height: 4),
              Text(
                tag,
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? Colors.white : SahimedColors.slate400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: SahimedColors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: SahimedColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: SahimedColors.primary),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: SahimedColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          child,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: SahimedColors.slate400,
              letterSpacing: 1.5,
            ),
          ),
        ),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          inputFormatters: inputFormatters,
          style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.outfit(
              color: SahimedColors.textSecondary.withOpacity(0.5),
              fontSize: 13,
            ),
            prefixIcon: Icon(
              icon,
              size: 20,
              color: SahimedColors.primary.withOpacity(0.5),
            ),
            filled: true,
            fillColor: SahimedColors.background.withOpacity(0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(
                color: SahimedColors.primary,
                width: 2,
              ),
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'REQUIRED';
            return null;
          },
        ),
      ],
    );
  }



  Widget _buildOrderSummary(CartProvider cart) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: SahimedColors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: SahimedColors.background, width: 2),
      ),
      child: Column(
        children: [
          _summaryRow(
            'Price (${cart.items.length} items)',
            '₹${cart.subtotal.toStringAsFixed(2)}',
          ),
          if (cart.packingFee > 0)
            _summaryRow(
              'Packing/Service Fee',
              '₹${cart.packingFee.toStringAsFixed(0)}',
            ),
          if (cart.deliveryFee > 0)
            _summaryRow(
              'Delivery Charge',
              '₹${cart.deliveryFee.toStringAsFixed(0)}',
            ),
          if (cart.deliveryFee == 0 && cart.items.isNotEmpty)
            _summaryRow(
              'Delivery Charge',
              'FREE',
              isGreen: true,
            ),
          if (cart.totalSavings > 0)
            _summaryRow(
              'Generic Savings',
              '- ₹${cart.totalSavings.toStringAsFixed(2)}',
              isGreen: true,
            ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Amount Payable',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: SahimedColors.textPrimary,
                ),
              ),
              Text(
                '₹${cart.finalTotal.toStringAsFixed(2)}',
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Wallet Deactivated
        ],
      ),
    );
  }



  Widget _summaryRow(String label, String value, {bool isGreen = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: SahimedColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 15,
              color: isGreen ? Colors.green : SahimedColors.textPrimary,
              fontWeight: isGreen ? FontWeight.w800 : FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
