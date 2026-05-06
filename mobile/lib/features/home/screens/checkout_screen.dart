import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/location_service.dart';
import 'order_status_screen.dart';

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

  // Wallet Integration
  double _walletBalance = 0;
  double _allowableWalletAmount = 0;
  bool _useWallet = false;
  String _walletReason = '';

  // Payment Integration
  late Razorpay _razorpay;
  String _paymentMethod = 'COD';


  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    
    _prescriptionImage = widget.initialPrescription;
    _loadData();
    _loadWalletInfo();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    _placeOrder(
      paymentId: response.paymentId,
      razorpayOrderId: response.orderId,
      signature: response.signature,
    );
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment Failed: ${response.message}'),
          backgroundColor: SahimedColors.accent,
        ),
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // Handle external wallet if needed
  }

  Future<void> _loadWalletInfo() async {
    final cart = context.read<CartProvider>();
    final walletData = await _apiService.validateWalletUse(
      cart.items.map((e) => {
        'id': e.product.id,
        'name': e.product.name,
        'price': e.product.price,
        'quantity': e.quantity,
        'category': e.product.liveData?['category'] ?? '',
      }).toList(),

    );

    if (mounted) {
      setState(() {
        _allowableWalletAmount = (walletData['allowable'] as num?)?.toDouble() ?? 0;
        _walletBalance = (walletData['currentBalance'] as num?)?.toDouble() ?? 0;
        _walletReason = walletData['reason'] ?? '';
      });
    }
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
        } else {
          // New User: Auto-detect location to save time
          _autoDetectLocation();
        }
      });
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
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _prescriptionImage = File(image.path));
    }
  }

  @override
  void dispose() {
    _razorpay.clear();
    _nameController.dispose();
    _houseController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _pincodeController.dispose();
    _landmarkController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleOnlinePayment() async {
    final cart = context.read<CartProvider>();
    final amountPayable = cart.finalTotal - (_useWallet ? _allowableWalletAmount : 0);

    try {
      final rzpOrder = await _apiService.createRazorpayOrder(amount: amountPayable);
      if (rzpOrder == null) throw Exception('Failed to create payment order');

      final options = {
        'key': 'rzp_test_SmCfTDc5ejqOnF',
        'amount': rzpOrder['amount'],
        'currency': 'INR',
        'name': 'SahiMed',
        'description': 'Clinical Healthcare Purchase',
        'order_id': rzpOrder['id'],
        'prefill': {
          'contact': _phoneController.text.trim(),
          'name': _nameController.text.trim(),
        },
        'theme': {
          'color': '#7C3AED', // Sahimed Primary Color
        }
      };

      _razorpay.open(options);
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment Initialization Failed: $e')),
        );
      }
    }
  }

  Future<void> _placeOrder({
    String? paymentId,
    String? razorpayOrderId,
    String? signature,
  }) async {
    // 1. Validation Logic
    if (_showAddressForm) {
      if (!_formKey.currentState!.validate()) return;
    } else {
      if (_selectedAddress == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select an address')),
        );
        return;
      }
      // Ensure name is actually present
      if (_nameController.text.trim().isEmpty || 
          _nameController.text == 'Sahimed User' || 
          _nameController.text == 'N/A') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PATIENT NAME IS MANDATORY')),
        );
        return;
      }
    }

    final cart = context.read<CartProvider>();
    List<String> prescriptions = [];

    // Soft Gate Check
    if (cart.isRxRequired &&
        _prescriptionImage == null &&
        !_isConsultationRequired) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'PRESCRIPTION REQUIRED • PLEASE UPLOAD OR TOGGLE CONSULTATION',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w900,
              fontSize: 10,
            ),
          ),
          backgroundColor: SahimedColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          margin: const EdgeInsets.all(20),
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    // TRIGGER ONLINE PAYMENT IF SELECTED AND NOT ALREADY PAID
    if (_paymentMethod == 'Online' && paymentId == null) {
      await _handleOnlinePayment();
      return; // Stop here, payment handler will resume via _handlePaymentSuccess
    }

    // Check serviceability
    try {
      final pincodeToCheck = _showAddressForm ? _pincodeController.text : _selectedAddress!['pincode'];
      final isServiceable = await _apiService.checkServiceability(pincodeToCheck);
      if (!isServiceable) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('We currently do not deliver to $pincodeToCheck'),
              backgroundColor: Colors.red,
            ),
          );
        }
        setState(() => _isProcessing = false);
        return;
      }
    } catch (e) {
      debugPrint('Serviceability check failed: $e');
    }

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
        'subtotal': cart.subtotal,
        'packingFee': 10.0,
        'deliveryFee': cart.subtotal < 499 ? 49.0 : 0.0,
        'total': cart.finalTotal,
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
        walletUsed: _useWallet ? _allowableWalletAmount : 0,
        paymentId: paymentId,
        razorpayOrderId: razorpayOrderId,
        signature: signature,
      );


      if (mounted) {
        if (orderId != null) {
          // BUG-04 FIX: Capture total BEFORE clearing cart to avoid showing ₹0
          final confirmedTotal = cart.finalTotal;
          final confirmedName = _nameController.text.trim();
          cart.clearCart();
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (context) => OrderStatusScreen(
                isSuccess: true,
                orderId: orderId,
                totalAmount: confirmedTotal,
                patientName: confirmedName,
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
              color: Colors.black26,
              child: Center(
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
            title: 'Online Payment',
            subtitle: 'UPI, Card, Net Banking',
            icon: LucideIcons.shieldCheck,
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
    bool isSelected = _selectedAddress?['id'] == addr['id'];
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
                child: Image.file(_prescriptionImage!, fit: BoxFit.cover),
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
          if (_allowableWalletAmount > 0)
            _summaryRow(
              'SahiWallet (Max Use)',
              '- ₹${_allowableWalletAmount.toStringAsFixed(2)}',
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
                '₹${(cart.finalTotal - (_useWallet ? _allowableWalletAmount : 0)).toStringAsFixed(2)}',
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (_allowableWalletAmount > 0)
            _buildWalletToggle(),
          if (_walletReason.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _walletReason,
                style: GoogleFonts.inter(fontSize: 10, color: Colors.redAccent, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWalletToggle() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: SahimedColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SahimedColors.primary.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.wallet, color: SahimedColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'USE SAHIWALLET BALANCE',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1),
                ),
                Text(
                  'Available: ₹${_walletBalance.toStringAsFixed(0)}',
                  style: GoogleFonts.inter(fontSize: 10, color: SahimedColors.slate500),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: _useWallet,
            activeColor: SahimedColors.primary,
            onChanged: (v) => setState(() => _useWallet = v),
          ),
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

  Widget _buildGlassPlaceOrderBar(CartProvider cart) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          decoration: BoxDecoration(
            color: SahimedColors.white.withOpacity(0.8),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(40),
              topRight: Radius.circular(40),
            ),
            border: Border.all(
              color: SahimedColors.white.withOpacity(0.3),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 30,
                offset: const Offset(0, -10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order Total',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: SahimedColors.textSecondary,
                    ),
                  ),
                  Text(
                    '₹${cart.finalTotal.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: Opacity(
                  opacity:
                      (cart.isRxRequired &&
                          _prescriptionImage == null &&
                          !_isConsultationRequired)
                      ? 0.6
                      : 1.0,
                  child: ElevatedButton(
                    onPressed: _isProcessing ? null : _placeOrder,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SahimedColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(22),
                      ),
                      elevation:
                          (cart.isRxRequired &&
                              _prescriptionImage == null &&
                              !_isConsultationRequired)
                          ? 0
                          : 8,
                      shadowColor: SahimedColors.primary.withOpacity(0.4),
                    ),
                    child: _isProcessing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            (cart.isRxRequired &&
                                    _prescriptionImage == null &&
                                    !_isConsultationRequired)
                                ? 'Upload Rx to Place Order'
                                : 'Securely Place Order',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
