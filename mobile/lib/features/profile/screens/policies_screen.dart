import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';

class PoliciesScreen extends StatefulWidget {
  const PoliciesScreen({super.key});

  @override
  State<PoliciesScreen> createState() => _PoliciesScreenState();
}

class _PoliciesScreenState extends State<PoliciesScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _pages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPages();
  }

  Future<void> _loadPages() async {
    final pages = await _apiService.getPages();
    if (mounted) {
      setState(() {
        _pages = pages;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      appBar: AppBar(
        title: Text(
          'POLICIES & SUPPORT',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 1,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: SahimedColors.primary,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: SahimedColors.primary),
            )
          : _pages.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _pages.length,
              itemBuilder: (context, index) {
                final page = _pages[index];
                return _buildPageTile(page);
              },
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.description_outlined,
            size: 64,
            color: SahimedColors.slate200,
          ),
          const SizedBox(height: 16),
          Text(
            'NO PAGES FOUND',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: SahimedColors.slate400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPageTile(Map<String, dynamic> page) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SahimedColors.slate100),
      ),
      child: ListTile(
        onTap: () => _showPageContent(page),
        title: Text(
          (page['title'] ?? 'Untitled').toUpperCase(),
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w900,
            fontSize: 13,
            color: SahimedColors.slate950,
          ),
        ),
        subtitle: Text(
          'Last updated: ${page['lastUpdated']?.toString().split('T').first ?? 'N/A'}',
          style: GoogleFonts.inter(fontSize: 10, color: SahimedColors.slate400),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: SahimedColors.slate300,
        ),
      ),
    );
  }

  void _showPageContent(Map<String, dynamic> page) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: SahimedColors.slate200,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                (page['title'] ?? 'Details').toUpperCase(),
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w900,
                  fontSize: 24,
                  letterSpacing: -0.5,
                ),
              ),
              const Divider(height: 32),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Text(
                    // Removing basic HTML tags if any, though the admin supports plain text too
                    (page['content'] ?? '').replaceAll(RegExp(r'<[^>]*>'), ''),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: SahimedColors.slate500,
                      height: 1.6,
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
